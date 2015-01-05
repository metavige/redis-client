/**
 * Redis Create Command
 *
 * 建立 Redis instance 的 Command
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var commons = require('../../base/commons'),
    logger = commons.logger;

(function() {

    function RedisCreateCommand(adapter) {
        this.adapter = adapter;
    }

    RedisCreateCommand.prototype.handle = function(options, cb) {

        function callCb(err) {
            if (cb != null) cb(err);
        }

        if (this.adapter.isManagerExist('redis', options.id)) {
            logger.info('Redis Manager 已經建立 !');
            callCb(null);
            return;
        }

        var rm = this.adapter.addManager('redis', options.id, new RedisManager());
        rm.init(options);

        var errorCb = function(err) {
            callCb(err); // 如果發生錯誤，callback error
        };

        rm.once('error', errorCb); // 先設定一個錯誤 callback
        rm.once('ready', function() {
            rm.removeListener('error', errorCb); // 如果正常啟動，移除這個 errorCb
            callCb(null);
        });
    }

    function RedisUpdateInfo(info) {

    }

    module.exports = RedisCreateCommand;
})();
