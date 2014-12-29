// var redis = require('redis');
var path = require('path'),
    async = require('async'),
    router = require('express').Router(),
    _ = require('underscore');

(function() {

    module.exports = function(webApp) {

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

                var sentinelData = req.body;
                webApp.logger.debug('Redis Api Request Body: ', sentinelData);

                // Check parameters
                // var msgPrefix = 'Bad arguments: ';
                // var failCallback = res.status(400).send;

                // Do flow
                async.series([

                    // Check procId
                    function(callback) {
                        webApp.guardCheck(callback,
                            _.isUndefined, sentinelData.procId,
                            'procId is undefined');
                    },
                    // Check name
                    function(callback) {
                        webApp.guardCheck(callback,
                            _.isUndefined, sentinelData.name,
                            'name is undefined');
                    },
                    // Check port
                    function(callback) {
                        var emptyStrRegEx = /^$/;

                        webApp.guardCheck(callback,
                            function(data) {
                                return emptyStrRegEx.test(data);
                            }, sentinelData.name, 'name is empty');
                    },
                    // Check port
                    function(callback) {
                        webApp.guardCheck(callback,
                            _.isUndefined, sentinelData.port,
                            'port is undefined');
                    },
                    // Check port
                    function(callback) {
                        webApp.guardCheck(callback,
                            _.isNaN, sentinelData.port, 'port is NaN');
                    },
                    // Check quorum
                    function(callback) {
                        webApp.guardCheck(callback,
                            _.isUndefined, sentinelData.quorum,
                            'quorum is undefined');
                    },
                    // Check quorum
                    function(callback) {
                        webApp.guardCheck(callback,
                            _.isNaN, sentinelData.quorum, 'quorum is NaN');
                    },

                    // Final add sentinel monitor settings
                    function(callback) {

                        // trigger sentinel monitor event
                        webApp.emit('sentinel.monitor',
                            sentinelData.name,
                            sentinelData.procId,
                            sentinelData);

                        res.status(200).end();

                        callback(null); // end flow
                    }
                ]);

            });
        return router;
    };

})();

//
// var sentinelMonitor = require(path.join(__dirname,
//     '/../lib/sentinel'));
// logger.debug('init sentinel monitor.....', (sentinelMonitor.instance != null));
//
// module.exports = router;
