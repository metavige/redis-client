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
                name: 'sentinel monitor name (redisInfo ResId)',
                procId: 'containerProcess Id',
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
                return;
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

            // Check procId
            function(callback) {
                guardCheck(callback,
                    _.isUndefined, sentinelData.procId, 'procId is undefined');
            },
            // Check name
            function(callback) {
                guardCheck(callback,
                    _.isUndefined, sentinelData.name, 'name is undefined');
            },
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
                    _.isUndefined, sentinelData.port, 'port is undefined');
            },
            // Check port
            function(callback) {
                guardCheck(callback,
                    _.isNaN, sentinelData.port, 'port is NaN');
            },
            // Check quorum
            function(callback) {
                guardCheck(callback,
                    _.isUndefined, sentinelData.quorum, 'quorum is undefined');
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
                        sentinelData.procId,
                        sentinelData);

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

var sentinelMonitor = require(path.join(__dirname,
    '/../lib/sentinel'));
logger.debug('init sentinel monitor.....', (sentinelMonitor.instance != null));

module.exports = router;
