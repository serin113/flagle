var express = require('express')
var path = require('path')
var app = express()

//setting middleware
app.get('/', function(req,res) {
    res.sendFile(path.join(__dirname, "Flaggle.html"))
})
app.get('/countries.json', function(req,res) {
    res.sendFile(path.join(__dirname, "countries.json"))
})


var server = app.listen(8000);