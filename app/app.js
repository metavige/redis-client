#!/usr/bin/env node
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    app = express();

var redisRouter = require(path.join(__dirname, 'routes/redisRoute'));
var logger = require(path.join(__dirname, 'lib/logger'));

// ==========
// start setting expressjs
// ==========
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/redis', redisRouter);

exports.server = app.listen(3000);
logger.info('Listening on port 3000...');
