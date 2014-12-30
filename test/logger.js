/**
 * 用來作 logger 記錄
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var winston = require('winston');

(function() {

    var _logger = new(winston.Logger)({
        transports: [
            new(winston.transports.File)({
                filename: 'test/test_spec.log',
                level: 'debug',
                // prettyPrint: true,
                maxsize: (1024 * 1024),
                maxFiles: 5,
                json: false
            }),
            new(winston.transports.Console)({
                level: 'info'
            })
        ]
    });

    module.exports = _logger;
})();
