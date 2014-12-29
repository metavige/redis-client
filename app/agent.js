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
    RedisManager = require('./redis/manager'),
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

        var logger = this.logger = require('./base/logger');

        var _config = new Config(this),
            _web = new AgentWeb(this),
            _manager = new RedisManager(this),
            _containerProxy = new ContainerProxy(this);

        // =======================================================
        // Internal Methods
        // =======================================================

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

        // =======================================================
        // Events
        // =======================================================
        this.on('error', function() {
            this.logger.error.call(this, '[ERROR]', arguments);
            // TODO: 錯誤處理～
        });

        // this.on('redis::instance.create', function() {
        //     this.logger.debug('[AGENT] trigger redis event: ', arguments[0]);
        // });

        this.on('redis::*', function() {

            var args = _.map(arguments);
            // console.log('trigger redis.* :', arguments);
            // listern all redis.* events
            // console.log('[AGENT] trigger redis event: ',
            //     this.event,
            //     args);
            args.unshift(this.event.replace('redis::', ''));
            console.log('[ARGS]', args);

            _manager.emit.apply(_manager, args);
            // delegate _apdater emit
            // _adapter.emit.apply(_adapter, arguments);
        });

        this.on('container::*', function() {
            var args = _.map(arguments);

            //this.logger.debug('[AGENT] trigger container event: ', this.event);
            args.unshift(this.event.replace('container::', ''));
            console.log('[AGENT][CONTAINER]', args);

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
