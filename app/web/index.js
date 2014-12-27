/**
 * Redis Agent Web index
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var express = require('express'),
    path = require('path'),
    bodyParser = require('body-parser');

// =======================================================
// Express Web
// =======================================================
(function() {

    function RedisWeb(agent) {

        var _app = express(),
            _this = this;

        // =======================================================
        // Public Methods
        // =======================================================

        /**
         * Web init, start new expressjs
         */
        this.init = function() {

            // ==============================
            // start setting expressjs
            // ==============================
            _app.use(bodyParser.urlencoded({
                    extended: false
                }));
            _app.use(bodyParser.json());
            _app.use(function(req, res, next) {
                // a middle function, for activity check
                agent.logger.debug('Time:', Date.now(), req.url);
                next();
            });

            // Add Routes
            addRoute('/ping'); // Simple Ping/Pong, for live check

            addRoute('/redis');

            // 設定只有 Proxy Container 才提供 sentinel 以及 proxy 的設定 API
            if (agent.isProxy()) {
                addRoute('/sentinel');
                addRoute('/proxy');
            }

            this.server = _app.listen(3000);

            agent.logger.info('============================');
            agent.logger.info(' Listening on port 3000... ');
            agent.logger.info('============================');
        };

        this.guardCheck = function(callback, checkFunc, paramData, messageGetter) {

            if (checkFunc.call(null, paramData) == true) {
                var message = _.isFunction(messageGetter) ? messageGetter.call(null,
                    paramData) : messageGetter;
                res.status(400).send({
                    message: message
                });
                return;
            }
            callback(null);
        };

        // delegate emit function to agent.emit
        this.emit = agent.emit;
        this.logger = agent.logger;

        // =======================================================
        // Private Methods
        // =======================================================

        /**
         * Add Router to Express Application
         * @param {String} routePath
         */
        function addRoute(routePath) {
            agent.logger.debug("add router [" + routePath + '] ..... ');

            _app.use(routePath, getRouter(routePath));
        }

        /**
         * Load a new router from other files
         * @param {String} routeName router file name
         */
        function getRouter(routeName) {

            return require(path.join(__dirname, 'routes' + routeName))(_this);
        }
    }

    module.exports = RedisWeb;
})();
