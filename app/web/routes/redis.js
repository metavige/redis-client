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


        /**
            Post Body = {
                id: 'containerProcessId',
                port: 'redis port',
                pwd: 'auth password',
                mem: 'allocate memory size'
            }
        */

        function RedisPostRoute(req, res, next) {

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
                function(err, result) {
                    if (err != null) {
                        res.status(400).send(err);
                        return;
                    }
                    //redisAdapter.newRedis(req.body);

                    // 觸發事件，準備建立 REDIS
                    webApp.emit('redis::instance.create', req.body);

                    res.status(200).end();
                    // end flow
                });

        }

        /* define redis api */
        router.route('/').post(RedisPostRoute);

        return router;
    };

})();
