// var redis = require('redis');
var express = require('express'),
    path = require('path'),
    router = express.Router();

// Load redisAdapter
var redisAdapter = require(path.join(__dirname, '/../lib/redis'));
var logger = require(path.join(__dirname, '../lib/logger'));


router.route('/')
    .post(function(req, res, next) {
        /**
            Post Body = {
                resId: 'redis info id',
                id: 'containerProcessId',
                port: 'proxy port',
                statPort: 'proxy stat port'
            }
        */

        var proxyData = req.body;
        logger.debug('Proxy Api Request Body: ', proxyData);

        // Call redisAdapter
        redisAdapter.createTwemProxy(proxyData.resId, proxyData.id, proxyData.port, proxyData.statPort);

        res.status(200).end();
    });

module.exports = router;
