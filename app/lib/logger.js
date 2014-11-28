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
        }),
        new(winston.transports.File)({
            filename: path.join(__dirname, '../../logs/agent.log'),
            level: 'debug'
        })
    ]
});
// logger.info('init logger.....');

module.exports = logger;
