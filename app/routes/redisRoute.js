// var redis = require('redis');
var express = require('express'),
    path = require('path'),
    async = require('async'),
    router = express.Router(),
    _ = require('underscore');

// Load redisAdapter
var redisAdapter = require(path.join(__dirname, '/../lib/redis'));
var logger = require(path.join(__dirname, '../lib/logger'));

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

        function guardCheck(callback, checkFunc, paramData, messageGetter) {

            if (checkFunc.call(null, paramData) == true) {
                var message = _.isFunction(messageGetter) ? messageGetter.call(null,
                    paramData) : messageGetter;
                res.status(400).send({
                    message: message
                });
                return;
            }
            callback(null);
        }

        logger.debug('Redis Api Request Body: ', req.body);

        var redisSettings = req.body;

        // Do flow
        async.series([
                // Check id
                function(callback) {
                    guardCheck(callback,
                        _.isUndefined, redisSettings.id, 'id is undefined');
                },
                // Check port
                function(callback) {
                    guardCheck(callback,
                        _.isNaN, redisSettings.port, 'port is NaN');
                },
                // Check memory
                function(callback) {
                    guardCheck(callback,
                        _.isNaN, redisSettings.mem, 'mem is NaN');
                },
                // Check password
                function(callback) {
                    guardCheck(callback,
                        _.isUndefined, redisSettings.pwd, 'pwd is undefined');
                }
            ],
            function(error, result) {
                if (error != null) return;
                // Final add sentinel monitor settings
                try {
                    redisAdapter.newRedis(req.body);

                    res.status(200).send(redisSettings);
                } catch (ex) {
                    logger.error('newRedis error: ', ex);
                    res.status(400).send({
                        message: ex.message
                    });
                }
                // end flow
            }
        );

    });

module.exports = router;
