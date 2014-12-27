/**
 * api /redis Route
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var router = require('express').Router(),
    path = require('path'),
    async = require('async'),
    _ = require('underscore');
;

(function() {

    module.exports = function(webApp) {

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

                webApp.logger.debug('Redis Api Request Body: ', req.body);

                var redisSettings = req.body;

                // Do flow
                async.series([
                        // Check id
                        function(callback) {
                            webApp.guardCheck(callback,
                                _.isUndefined, redisSettings.id, 'id is undefined');
                        },
                        // Check port
                        function(callback) {
                            webApp.guardCheck(callback,
                                _.isNaN, redisSettings.port, 'port is NaN');
                        },
                        // Check memory
                        function(callback) {
                            webApp.guardCheck(callback,
                                _.isNaN, redisSettings.mem, 'mem is NaN');
                        },
                        // Check password
                        function(callback) {
                            webApp.guardCheck(callback,
                                _.isUndefined, redisSettings.pwd, 'pwd is undefined');
                        }
                    ],
                    function(error, result) {
                        if (error != null) return;
                        // Final add sentinel monitor settings
                        try {
                            //redisAdapter.newRedis(req.body);

                            // trigger agent to report redis created
                            webApp.emit('redis.instance.created', req.body);

                            res.status(200).send(redisSettings);
                        } catch (ex) {
                            // agent.logger.error('newRedis error: ', ex);
                            webApp.emit('error', 'newRedis error', ex);

                            res.status(400).send({
                                message: ex.message
                            });
                        }
                        // end flow
                    }
                );

            });

        return router;
    };

})();
