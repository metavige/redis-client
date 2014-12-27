/**
 * 用來作 logger 記錄
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var winston = require('winston'),
    path = require('path');

(function() {

    var _logger = new(winston.Logger)({
        transports: [
            new(winston.transports.Console)({
                level: 'debug'
            })
        ]
    });

    module.exports = _logger;
})();
