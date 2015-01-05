/**
 * 一些常用的共用方法
 *
 * Created by rickychiang on 14/12/31.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    path = require('path'),
    EventEmitter = require('events').EventEmitter,
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    logger = require(path.join(__dirname, './logger')),
    _ = require("underscore");

(function() {

    var commons = module.exports = {};

    // =======================================================
    // 把常用的 module 放到屬性裡面去
    // =======================================================
    commons._ = _;
    commons.path = path;
    commons.logger = logger;
    commons.util = util;

    // =======================================================
    // 提供一些比較常用的方法
    // =======================================================
    commons.inherits = function(clazz, superClazz) {
        superClazz = (_.isString(superClazz)) ? require(superClazz) : superClazz;
        return util.inherits(clazz, superClazz);
    };

    commons.extendEventEmitter = function(clazz, options) {
        this.inherits(clazz, EventEmitter);
    };

    commons.extendEventEmitter2 = function(clazz, options) {
        this.inherits(clazz, EventEmitter2);
    };

    commons.listenerCount = function(emitter, event) {
        return EventEmitter.listenerCount(emitter, event);
    };

    commons.getPublicIp = function() {
        var ni = require('os').networkInterfaces();
        var eth0Ipv4 = _.filter(ni['eth0'], function(data) {
            return data.family == 'IPv4'
        });

        return (eth0Ipv4.length > 0) ? eth0Ipv4[0].address : null;
    };

    commons.setDefaultOptions = function(originalOptions, defaults) {
        originalOptions || (originalOptions = {});
        Object.keys(defaults).forEach(function(def) {
            if (!originalOptions[def]) originalOptions[def] = defaults[def]
        });

        return originalOptions;
    }

})();
