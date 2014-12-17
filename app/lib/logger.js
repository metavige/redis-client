/**
 * 用來作 logger 記錄
 *
 */

var winston = require('winston'),
    path = require('path');

var logger = new(winston.Logger)({
    transports: [
        new(winston.transports.Console)({
            level: 'debug'
        })
    ]
});
// logger.info('init logger.....');

module.exports = logger;
