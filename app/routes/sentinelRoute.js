// var redis = require('redis');
var express = require('express'),
    path = require('path'),
    async = require('async'),
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

        function guardCheck(callback, guradFunc, paramData, messageGetter) {

            if (guradFunc.call(null, paramData) == true) {
                var message = _.isFunction(messageGetter) ? messageGetter.call(null,
                    paramData) : messageGetter;
                res.status(400).send({
                    message: message
                });
            }

            callback(null);
        }

        var sentinelData = req.body;
        logger.debug('Redis Api Request Body: ', sentinelData);

        // Check parameters
        // var msgPrefix = 'Bad arguments: ';
        // var failCallback = res.status(400).send;

        // Do flow
        async.series([
            // Check port
            function(callback) {
                var emptyStrRegEx = /^$/;

                guardCheck(callback,
                    function(data) {
                        return emptyStrRegEx.test(data);
                    }, sentinelData.name, 'name is empty');
            },

            // Check port
            function(callback) {
                guardCheck(callback,
                    _.isNaN, sentinelData.port, 'port is NaN');
            },
            // Check quorum
            function(callback) {
                guardCheck(callback,
                    _.isNaN, sentinelData.quorum, 'quorum is NaN');
            },

            // Final add sentinel monitor settings
            function(callback) {
                try {
                    redisAdapter.addSentinelMonitor(sentinelData.name,
                        sentinelData.ip,
                        sentinelData.port,
                        sentinelData.pwd,
                        sentinelData.quorum);

                    res.status(200).end();
                } catch (ex) {
                    logger.error('addSentinelMonitor error: ', ex);
                    res.status(400).send({
                        message: ex.message
                    });
                }
                callback(null); // end flow
            }
        ]);

    });

module.exports = router;
