#!/usr/bin/env node

var express = require('express'),
    redisRouter = require('./routes/redisRoute');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());

app.use('/redis', redisRouter);
// app.get('/wines/:id', wines.findById);

exports.server = app.listen(3000);
console.log('Listening on port 3000...');
