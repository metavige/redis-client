// var redis = require('redis');
var path = require('path'),
    async = require('async'),
    router = require('express').Router(),
    _ = require('underscore');

(function() {

    module.exports = function(webApp) {

        var logger = webApp.logger,
            validate = webApp.validate;

        function SentinelRoute(req, res, next) {
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

            var r = req.body;
            logger.debug('Redis Api Request Body: ', r);

            // Check parameters
            // var msgPrefix = 'Bad arguments: ';
            // var failCallback = res.status(400).send;

            // Do flow
            async.series([
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.procId);
                    }, 'procId is undefined', cb);
                },
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.port) || _.isNaN(r.port);
                    }, 'port is undefined or NaN', cb);
                },
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.quorum) || _.isNaN(r.quorum);
                    }, 'quorum is undefined or NaN', cb);
                },
                function(cb) {
                    var emptyStrRegEx = /^$/;

                    validate(function() {
                        return _.isUndefined(r.name) || emptyStrRegEx.test(
                            data);
                    }, 'name is undefined or empty', cb);
                }
            ], function(err, result) {
                if (err != null) {
                    res.status(400).send(err);
                    return;
                }

                // trigger sentinel monitor event
                webApp.emit('container::sentinel.monitor',
                    r.name, r.procId, r);

                res.status(200).end();
            });
        }

        router.route('/').post(SentinelRoute);

        return router;
    };

})();

//
// var sentinelMonitor = require(path.join(__dirname,
//     '/../lib/sentinel'));
// logger.debug('init sentinel monitor.....', (sentinelMonitor.instance != null));
//
// module.exports = router;
