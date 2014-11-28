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

            if (checkFunc.call(null, paramData) == false) {
                var message = _.isFunction(messageGetter) ? messageGetter.call(null,
                    paramData) : messageGetter;
                res.status(400).send({
                    message: message
                });
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
                    _.NaN, redisSettings.port, 'port is NaN');
            },
            // Check memory
            function(callback) {
                guardCheck(callback,
                    _.NaN, redisSettings.mem, 'mem is NaN');
            },
            // Check password
            function(callback) {
                guardCheck(callback,
                    _.isUndefined, redisSettings.pwd, 'pwd is undefined');
            },
            // Final add sentinel monitor settings
            function(callback) {

                try {
                    redisAdapter.newRedis(req.body);

                    res.status(200).send(redisSettings);
                } catch (ex) {
                    logger.error('newRedis error: ', ex);
                    res.status(400).send({
                        message: ex.message
                    });
                }
                callback(null); //
                // end flow
            }
        ]);

    });

module.exports = router;
