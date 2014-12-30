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
var util = require('util'),
    async = require('async'),
    _ = require('underscore'),
    path = require('path'),
    RedisCreateCommand = require(path.join(__dirname, './create'));

(function() {

    function RedisRestartCommand(manager) {
        RedisRestartCommand.super_.call(this, manager);
    }

    util.inherits(RedisRestartCommand, RedisCreateCommand)

    /**
     * 重新啟動 Redis 的 Command 執行命令
     * @param  {[type]}   options [description]
     * @param  {Function} cb      callback 方法。測試用
     * @return {[type]}           [description]
     */
    RedisRestartCommand.prototype.handle = function(options, cb) {

        var _self = this,
            logger = this.manager.logger;
        // logger.debug('manager:', this.manager);

        logger.debug('call restart redis', options);

        // 先加入第一個步驟，建立一個新的 Redis
        var asyncSeries = [
            function(callback) {
                //logger.debug('super:', RedisRestartCommand.super_);
                RedisCreateCommand.prototype.handle.call(
                    _self,
                    options,
                    callback);
            }
        ];

        // 如果不是 Master (一般如果重起的話，應該就不是.....不過有可能有時間差～導致還沒回寫 IsMaster)
        if (options.isMaster === false) {
            // execute: redis-cli -p [port] -a [pwd] config set MASTERAUTH passwd
            var cmdArgs = ['config', 'set', 'MASTERAUTH', options.pwd];

            // 再加入設定 MASTERAUTH 的步驟
            asyncSeries.push(function(callback) {
                logger.debug('call config set MASTERAUTH');
                _self.manager.redisCli(callback, options.port, options.pwd, cmdArgs);
            });
        }

        // 執行步驟
        async.series(asyncSeries,
            function(err, result) {

                if (err != null) {
                    // print error
                    _self.manager.emit('error', 'RedisRestartCommand', err);
                } else {
                    logger.info('restart redis ok!');
                }
                // logger.debug('cbCall', err, result);
                // logger.debug('err', err);
                // logger.debug('result', result);
                cbCall(err, result);
            });

        /**
         * 測試用，簡單的回呼，如果有傳遞進來 cb
         * @param {[type]} err    [description]
         * @param {[type]} result [description]
         */
        function cbCall(err, result) {

            if (cb != null) {
                cb(err, result);
            }
        }
    };

    module.exports = RedisRestartCommand;

})();
