/**
 * Redis Restart Command
 *
 * 重新啟動 Redis instance 的 Command
 * 基本上與建立一個新的 Redis 差不多，不過會多加上一個 Slave 恢復的動作～
 *
 * Created by rickychiang on 14/12/30.
 */

// =======================================================
// Module dependencies
// =======================================================
var RedisCreateCommand = require('./create'),
    util = require('util'),
    _ = require('underscore');

(function() {

    function RedisRestartCommand(manager) {
        RedisRestartCommand.super_.call(this, manager);
    }

    util.inherits(RedisRestartCommand, RedisCreateCommand)


    RedisRestartCommand.prototype.handle = function(options) {

        console.log('call restart redis', options);

        var _self = this;

        // 先加入第一個步驟，建立一個新的 Redis
        var asyncSeries = [
            function(cb) {
                RedisRestartCommand.super_.handle.apply(this, options, cb);
            }
        ];

        // 如果不是 Master (一般如果重起的話，應該就不是.....不過有可能有時間差～導致還沒回寫 IsMaster)
        if (options.isMaster === false) {
            // execute: redis-cli -p [port] -a [pwd] config set MASTERAUTH passwd
            var cmdArgs = ['config', 'set', 'MASTERAUTH', options.pwd];

            // 再加入設定 MASTERAUTH 的步驟
            asyncSeries.push(function(cb) {
                _self.manager.redisCli(cb, options.port, options.pwd, cmdArgs);
            });
        }

        // 執行步驟
        async.series(asyncSeries,
            function(err, result) {
                if (err != null) {
                    // print error
                    _self.manager.emit('error', 'RedisRestartCommand', err);
                    return;
                }
                logger.info('restart redis ok!');
            });
    };

    module.exports = RedisRestartCommand;

})();
