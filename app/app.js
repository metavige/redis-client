#!/usr/bin/env node

var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser'),
    app = express();

var logger = require(path.join(__dirname, 'lib/logger'));
var config = require(path.join(__dirname, 'lib/config'));

// ==============================
// start setting expressjs
// ==============================
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(bodyParser.json());
app.use('/redis', getRouter('redisRoute'));

// 設定只有 Proxy Container 才提供 sentinel 以及 proxy 的設定 API
if (config.isProxy()) {
    app.use('/sentinel', getRouter('sentinelRoute'));
    app.use('/proxy', getRouter('proxyRoute'));
}

// Simple Ping/Pong
// respond with "Hello World!" on the homepage
app.get('/ping', function (req, res) {
  res.send('PONG');
})

exports.server = app.listen(3000);
logger.info('Listening on port 3000...');

function getRouter(routeName) {
    return require(path.join(__dirname, 'routes/' + routeName));
}