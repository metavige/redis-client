/**
 * Redis Agent Main class
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var path = require('path'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Config = require('./base/config'),
    AgentWeb = require('./web/index');

// =======================================================
// Redis Agent
// =======================================================
(function() {

    var RedisAgent = function() {

        var _config = new Config(this),
            _web = new AgentWeb(this);

        this.logger = require('./base/logger');

        // =======================================================
        // Internal Methods
        // =======================================================

        /**
         * check agent environment is ready?
         */
        var _checkEnvironment = function() {
            if (_config.container == null) {
                // call containerApi to register
            }
        };

        // =======================================================
        // Public Methods
        // =======================================================
        this.init = function() {

            // 初始化 config
            _config.init();

            _checkEnvironment();

            // 初始化 web，開始接聽 API 要求
            _web.init();
        };

        this.isProxy = function() {
            return _config.isProxy();
        };

        this.on('error', function()) {
            this.logger.error.call(this, '[ERROR]', arguments);
        };

        // =======================================================
        // Public Methods
        // =======================================================
    };

    // RedisAgent extend EventEmitter
    util.inherits(RedisAgent, EventEmitter);

    // =======================================================
    // module exports
    // =======================================================
    // Node.js
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = RedisAgent;
    }
    // AMD / RequireJS
    else if (typeof define !== 'undefined' && define.amd) {
        define([], function() {
            return RedisAgent;
        });
    }
})();
