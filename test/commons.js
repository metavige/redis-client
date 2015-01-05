/**
 * 提供測試案例的一些共用方法
 */

var util = require('util'),
    path = require('path'),
    child_process = require('child_process'),
    logger = require(path.join(__dirname, './logger')),
    EventEmitter = require('events').EventEmitter;

var testCommons = module.exports = {
    expect: require('expect.js'),
    appBase: path.join(__dirname, '../app'),
    logger: logger,
    spawn: child_process.spawn,
    exec: child_process.exec,
    fs: require('fs'),
    _: require('underscore')
};

testCommons.getTestClass = function(appClassPath) {
    var clazzPath = path.join(this.appBase, appClassPath);
    logger.debug('get test class:', clazzPath);
    return require(clazzPath);
};

testCommons.extendEventEmitter = function(clazz) {
    return util.inherits(clazz, EventEmitter);
};
