// var redis = require('redis');

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

        /**
            Post Body = {
                resId: 'redis info id',
                id: 'containerProcessId',
                port: 'proxy port',
                statPort: 'proxy stat port'
            }
        */
        router.route('/')
            .post(function(req, res) {

                var proxyData = req.body;
                webApp.logger.debug('Proxy Api Request Body: ', proxyData);

                // trigger agent to create proxy
                webApp.emit('redis.proxy.create',
                    proxyData.resId,
                    proxyData.id,
                    proxyData.port,
                    proxyData.statPort);

                res.status(200).end();
            });

        return router;
    };

})();
