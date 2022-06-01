var express = require('express')
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit')
const allowlist = ['127.0.0.1','110.137.195.232']
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (request, response) => allowlist.includes(request.ip), // Skip rate limiting for whitelisted requests
})
var app = express()
var fs = require('fs')
var cors = require('cors')
app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(limiter)
app.options('*', cors())
function GenerateId(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function GrabKeys() {
    var keys = fs.readFileSync('keys.json', 'utf8')
    return JSON.parse(keys)
}
function CheckKey(key) {
    var keys = GrabKeys()
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].key === key && keys[i].expired === false) {
            return true
        }
        else if (keys[i].expired === true) {
            return "Expired"
        }
        else {
            return false
        }
    }
    return false
}
app.get('/api/key/status/:key', function (req, res) {
    var key = req.params.key
    var status = CheckKey(key)
    if (status === true) {
        res.send("Valid")
    }
    else if (status === false) {
        res.send("Invalid")
    }
    else {
        res.send("Expired")
    }
})
app.post('/api/key/generate', function (req, res) {
    const body = req.body
    var expire = body.expiredate
    var name = body.name
    if (expire === undefined || name === undefined``) {
        res.send("Missing Parameters")
    }
    else {
        var key = GenerateId(24)
        var keys = GrabKeys()
        var newKey = {
            key: key,
            name: name,
            expiredate: expire,
            expired: false
        }
        keys.push(newKey)
        fs.writeFileSync('keys.json', JSON.stringify(keys))
        res.send(newKey)
    }
})
app.post('/api/key/expire/', function (req, res) {
    //if any keys in the keys database expire date is the same date as the current date
    //set the expired to true
    var keys = GrabKeys()
    var currentDate = new Date()
    var currentDateString = currentDate.toDateString()
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].expiredate === currentDateString) {
            keys[i].expired = true
        }
    }
    fs.writeFileSync('keys.json', JSON.stringify(keys))
    res.send("Remove all Expired keys")
})
app.delete('/api/key/delete/:key', function (req, res) {
    var key = req.params.key
    var keys = GrabKeys()
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].key === key) {
            keys.splice(i, 1)
        }
    }
    fs.writeFileSync('keys.json', JSON.stringify(keys))
    res.send("Deleted")
})
app.get('/api/key/:key', function (req, res) {
    var key = req.params.key
    var keys = GrabKeys()
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].key === key) {
            res.send(keys[i])
        }
        else {
            res.send("Invalid")
        }
    }
})
app.post('/api/key/update/:key', function (req, res) {
    var keys = GrabKeys()
    var body = req.body
    var key = body.key
    for (var i = 0; i < keys.length; i++) {
        if (keys[i].key === key) {
            keys[i].name = body.name
            keys[i].expiredate = body.expiredate
            keys[i].expired = body.expired
            res.send(keys[i])
        }
        else {
            res.send("Invalid")
        }
    }
})
app.get('/api/person/search/:query', function (req, res) {
    var query = req.params.query
    if (query.length > 2) {
        var data = fs.readFileSync('data.json')
        var json = JSON.parse(data)
        //check if query is in any of the objects in the json file and if so return the objects parrent
        var result = json.filter(function (item) {
            return item.name.toLowerCase().includes(query.toLowerCase())
        })
        if (result.length > 0) {
            res.send(result)
        }
        else {
            res.send([])
        }
    }
    else if (query.length == 0 || query == null || query == undefined || query.length < 2) {
        res.send([])
    }
})
app.get('/api/person/add/:name/:age/:sex/:family/:number', function (req, res) {
    if (req.params.key == '3094FFB0-A55E-4E89-A7B0-882D7F3C3A76' || CheckKey(req.query.key) == true) {
        var name = req.params.name
        var age = req.params.age
        var sex = req.params.sex
        var family = req.params.family
        var number = req.params.number
        var data = fs.readFileSync('data.json')
        var json = JSON.parse(data)
        //check if query is in any of the objects in the json file and if so return the objects parrent
        var result = json.filter(function (item) {
            return item.name.toLowerCase().includes(name.toLowerCase())
        })
        if (result.length > 0) {
            res.send('Person already exists')
        } else {
            json.push({
                name: name,
                age: age,
                sex: sex,
                family: family,
                id: GenerateId(4),
                phonenumber: number
            })
            fs.writeFileSync('data.json', JSON.stringify(json))
            res.send('Person added')
        }
    }
    else {
        res.send('Invalid key')
    }
})
app.get('/api/person/:id', function (req, res) {
    if (req.query.key == '3094FFB0-A55E-4E89-A7B0-882D7F3C3A76' || CheckKey(req.query.key) == true) {
        var id = req.params.id
        var data = fs.readFileSync('data.json')
        var json = JSON.parse(data)
        //check if query is in any of the objects in the json file and if so return the objects parrent
        var result = json.filter(function (item) {
            return item.id.toLowerCase().includes(id.toLowerCase())
        })
        if (result.length > 0) {
            var i = 0
            if (result[i].name == "null") {
                result[i].name = "unknown"
            }
            if (result[i].age == "null") {
                result[i].age = "unknown"
            }
            if (result[i].sex == "null") {
                result[i].sex = "unknown"
            }
            if (result.family == "null") {
                result[i].family = "unknown"
            }
            if (result[i].phonenumber == "null") {
                result[i].phonenumber = "unknown"
            }
            res.send(result[0])
        }
        else {
            res.send('no results')
        }
    }
    else {
        res.send('Invalid key')
    }
})
app.delete('/api/person/delete/:id', function (req, res) {
    if (req.query.key == '3094FFB0-A55E-4E89-A7B0-882D7F3C3A76' || CheckKey(req.query.key) == true) {
        var id = req.params.id
        var data = fs.readFileSync('data.json')
        var json = JSON.parse(data)
        //check if query is in any of the objects in the json file and if so return the objects parrent
        var result = json.filter(function (item) {
            return item.id.toLowerCase().includes(id.toLowerCase())
        })
        if (result.length > 0) {
            json.splice(json.indexOf(result[0]), 1)
            fs.writeFileSync('data.json', JSON.stringify(json))
            res.send('Person deleted')
        }
        else {
            res.send('no results')
        }
    }
    else {
        res.send('Invalid key')
    }
})
app.get('/api/person/getid/:name', function (req, res) {
    if (req.query.key == '3094FFB0-A55E-4E89-A7B0-882D7F3C3A76' || CheckKey(req.query.key) == true) {
        var name = req.params.name
        var data = fs.readFileSync('data.json')
        var json = JSON.parse(data)
        //check if query is in any of the objects in the json file and if so return the objects parrent
        var result = json.filter(function (item) {
            return item.name.toLowerCase().includes(name.toLowerCase())
        })
        if (result.length > 0) {
            res.send(result[0].id)
        }
        else {
            res.send('no results')

        }
    }
    else {
        res.send('Invalid key')
    }
})
app.get('/person/', function (req, res) {
    res.sendFile(__dirname + '/person.html')
})
app.get('/person/add/', function (req, res) {
    res.sendFile(__dirname + '/add.html')
})
app.get('/person/delete', function (req, res) {
    res.sendFile(__dirname + '/delete.html')
})
app.get('/style.css', function (req, res) {
    //show the style.css file
    res.sendFile(__dirname + '/style.css')
})
app.get('/', function (req, res) {
    res.redirect('/person/search')
})
app.get('/script.js', function (req, res) {
    //show the script.js file
    res.sendFile(__dirname + '/script.js')
})
app.get('/person/search/', function (req, res) {
    res.sendFile(__dirname + '/index.html')
})
app.get('/person/getId/', function (req, res) {
    res.sendFile(__dirname + '/getId.html')
})
app.listen(3000, function () {
    console.log('Example app listening on port 3000!')
})