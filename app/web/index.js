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
    bodyParser = require('body-parser'),
    logger = require(path.join(__dirname, '../base/logger')),
    _ = require('underscore');

// =======================================================
// Express Web
// =======================================================
(function() {

    function RedisWeb(agent) {

        var _app = express(),
            _this = this;

        this.agent = agent;
        this.logger = logger;
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

            _app.use(function(req, res, next) {
                try {
                    next();
                } catch (ex) {
                    // 做 Api 的錯誤處理記錄
                    _this.agent.emit('error', req, ex);
                }
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

            logger.info('============================');
            logger.info(' Listening on port 3000... ');
            logger.info('============================');
        };

        this.guardCheck = function(callback, checkFunc, paramData, messageGetter) {

            if (checkFunc.call(null, paramData) == true) {
                var message = _.isFunction(messageGetter) ? messageGetter.call(
                    null,
                    paramData) : messageGetter;

                callback(message);
            }
            callback(null);
        };

        this.validate = function(validator, message, cb) {
            cb((validator.call(null)) ? message : null);
        };

        // =======================================================
        // Private Methods
        // =======================================================

        /**
         * Add Router to Express Application
         * @param {String} routePath
         */
        function addRoute(routePath) {
            logger.debug("add router [" + routePath + '] ..... ');

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

    // delegate agent emit function.....
    RedisWeb.prototype.emit = function() {
        var args = _.map(arguments);

        logger.debug('[REDIS_WEB] trigger ', args);
        args[0] = 'redis::' + args[0];
        console.log(args);

        this.agent.emit.apply(this.agent, args);
    };

    module.exports = RedisWeb;
})();
