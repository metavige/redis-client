// var redis = require('redis');
var express = require('express'),
    path = require('path'),
    router = express.Router(),
    _ = require('underscore');

// Load redisAdapter
var redisAdapter = require(path.join(__dirname, '/../lib/redis'));
var logger = require(path.join(__dirname, '../lib/logger'));

router.route('/')
    .post(function(req, res, next) {
        /**
            Post Body = {
                name: 'sentinel monitor name',
                ip: 'master redis host',
                port: 'master redis port',
                pwd: 'auth password',
                quorum: 'quorum' (default 1)
            }
         */
        logger.debug('Redis Api Request Body: ', req.body);

    });

module.exports = router;
