// var redis = require('redis');
var express = require('express'),
    util = require('util'),
    exec = require('child_process').exec,
    redisClient = require('redis'),
    http = require('http'),
    router = express.Router(),
    _ = require('underscore');

var redisAdapter = require(__dirname + '/../lib/redis');

/* define redis api */
router.route('/')
    .post(function(req, res, next) {
        /**
            Post Body = {
                id: 'containerProcessId',
                port: 'redis port',
                pwd: 'auth password',
                mem: 'allocate memory size'
            }
         */

        /**
            1. get redis create process param from body
            2. make redis start process command
            3. usr child_process.exec to execute command (async)
            4. return command execute status, ok or fail
         */
        console.log('Redis Api Request Body: ', req.body);

        var redisSettings = req.body;

        redisAdapter.create(req.body);

        res.status(200).send(redisSettings);
        // next();
    });

module.exports = router;
