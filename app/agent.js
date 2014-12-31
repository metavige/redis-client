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
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    // EventEmitter = require('events').EventEmitter,
    Config = require('./base/config'),
    AgentWeb = require('./web/index'),
    RedisAdapter = require('./redis/adapter'),
    ContainerProxy = require('./containers/proxy'),
    _ = require('underscore');

// =======================================================
// Redis Agent
// =======================================================
(function() {

    var RedisAgent = function() {

        // Call EventEmitter2 ctor
        RedisAgent.super_.call(this, {
            wildcard: true,
            delimiter: '::'
        });

        // =======================================================
        // Fields
        // =======================================================
        var logger = this.logger = require('./base/logger');

        var _config = new Config(this),
            _web = new AgentWeb(this),
            _adapter = new RedisAdapter(this),
            _containerProxy = new ContainerProxy(this);

        // =======================================================
        // Public Methods
        // =======================================================
        this.init = function() {
            // 初始化 config
            _config.init();

            // 初始化 web，開始接聽 API 要求
            _web.init();
        };

        this.isProxy = function() {
            return _config.isProxy();
        };

        this.getId = function() {
            return _config.getContainerId();
        };

        this.getSentinelConfig = function() {
            return _config.getSentinelConfig();
        };

        this.getContainerApi = function(apiUrl) {
            return _config.getContainerApi(apiUrl);
        };


        // =======================================================
        // Events
        // =======================================================
        this.on('error', function() {
            var args = _.map(arguments);
            args.unshift('[ERROR]');

            logger.error.apply(logger, args);
            // TODO: 錯誤處理～
        });

        this.on('fatal', function() {
            var args = _.map(arguments);
            args.unshift('[ERROR]');
            logger.error.apply(logger, args);

            process.exit(1);
        });

        // this.on('redis::instance.create', function() {
        //     this.logger.debug('[AGENT] trigger redis event: ', arguments[0]);
        // });

        this.on('redis::*', function() {
            logger.debug('[REDIS][ADAPTER]', arguments);

            var args = _.map(arguments);
            // console.log('trigger redis.* :', arguments);
            // listern all redis.* events
            // console.log('[AGENT] trigger redis event: ',
            //     this.event,
            //     args);
            args.unshift(this.event.replace('redis::', ''));

            _adapter.emit.apply(_adapter, args);
            // delegate _apdater emit
            // _adapter.emit.apply(_adapter, arguments);
        });

        this.on('container::*', function() {
            logger.debug('[AGENT][CONTAINER]', arguments);
            var args = _.map(arguments);

            //this.logger.debug('[AGENT] trigger container event: ', this.event);
            args.unshift(this.event.replace('container::', ''));

            // delegate _containerProxy emit
            _containerProxy.emit.apply(_containerProxy, args);
        });
    };

    // RedisAgent extend EventEmitter
    util.inherits(RedisAgent, EventEmitter2);

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
