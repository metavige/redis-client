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
    _ = require('underscore');;

(function() {

    module.exports = function(webApp) {

        // console.log('webApp:', webApp);
        var logger = webApp.logger,
            validate = webApp.validate;

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

                logger.debug('Redis Api Request Body: ', req.body);

                var r = req.body;

                // Do flow
                // TODO: 把檢查的部份，要做成 util methods
                async.series([
                        function(cb) {
                            validate(function() {
                                return _.isUndefined(r.id);
                            }, 'id is undefined', cb);
                        },
                        function(cb) {
                            validate(function() {
                                return _.isUndefined(r.port) || _.isNaN(r.port);
                            }, 'port is undefined or NaN', cb);
                        },
                        function(cb) {
                            validate(function() {
                                return _.isUndefined(r.mem) || _.isNaN(r.mem);
                            }, 'mem is undefined or NaN', cb);
                        },
                        function(cb) {
                            validate(function() {
                                return _.isUndefined(r.pwd);
                            }, 'pwd is undefined', cb);
                        }
                    ],
                    function(error, result) {
                        if (error != null) {
                            res.status(400).send(error);
                            return;
                        }
                        //redisAdapter.newRedis(req.body);

                        // trigger agent to report redis created
                        webApp.emit('instance.create', req.body);

                        res.status(200).end();
                        // end flow
                    }
                );

            });

        return router;
    };

})();
