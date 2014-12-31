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
    commons.logger = logger;
    commons.util = util;

    // =======================================================
    // 提供一些比較常用的方法
    // =======================================================
    commons.inherits = function(clazz, superClazz) {
        superClazz = (_.isString(superClazz)) ? require(superClazz) : superClazz;
        return util.inherits(clazz, superClazz);
    };

    commons.addEventEmitter = function(clazz, options) {
        this.inherits(clazz, EventEmitter);
    };

    commons.addEventEmitter2 = function(clazz, options) {
        this.inherits(clazz, EventEmitter2);
    };

})();
