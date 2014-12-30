/**
 * api /proxy Route
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var router = require('express').Router();

(function() {

    module.exports = function(webApp) {

        var logger = webApp.logger,
            validate = webApp.validate;

        /**
            Post Body = {
                resId: 'redis info id',
                id: 'containerProcessId',
                port: 'proxy port',
                statPort: 'proxy stat port'
            }
        */

        function ProxyPostRoute(req, res) {

            var r = req.body;
            logger.debug('Proxy Api Request Body: ', r);

            // Do flow
            async.series([
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.id);
                    }, 'id is undefined', cb);
                },
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.resId);
                    }, 'resId is undefined', cb);
                },
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.port) || _.isNaN(r.port);
                    }, 'port is undefined or NaN', cb);
                },
                function(cb) {
                    validate(function() {
                        return _.isUndefined(r.statPort) || _.isNaN(r.statPort);
                    }, 'statPort is undefined or NaN', cb);
                }
            ], function(err, result) {
                if (err != null) {
                    res.status(400).send(err);
                    return;
                }

                // trigger agent to create proxy
                webApp.emit('container::proxy.create',
                    r.resId,
                    r.id,
                    r.port,
                    r.statPort);

                res.status(200).end();
            });
        }

        router.route('/').post(ProxyPostRoute);

        return router;
    };

})();
