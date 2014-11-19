#!/usr/bin/env node

var express = require('express'),
    bodyParser = require('body-parser');

var redisRouter = require('./routes/redisRoute');
var config = require('./lib/config');
var nebula = require('./lib/nebula');

var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use('/redis', redisRouter);
// app.get('/wines/:id', wines.findById);

exports.server = app.listen(3000);
console.log('Listening on port 3000...');

// Start config init, register container
config.init();
nebula.init();
