/**
 * Redis Instance Created Api
 *
 * 呼叫 ContainerApi 做回報 Redis Instance 已經建立的狀態更新
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var BaseCommand = require('../baseCommand'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore');

(function() {

    function InstanceCreatedCommand(proxy) {
        // call super ctor
        InstanceCreatedCommand.super_.call(this, proxy);
    }
    util.inherits(InstanceCreatedCommand, BaseCommand);

    InstanceCreatedCommand.prototype.handle = function(redisInfo, cb) {

        var logger = this.logger;

        // 網址組合成 api/containers/{containerId}/process/{processId}
        var url = path.join('/api/containers',
            this.proxy.agent.getId(),
            'process',
            redisInfo.id);

        logger.debug('call redis update status api: ', url, redisInfo);

        this.callApi(url, 'PUT', redisInfo).then(function(res) {

            var statusCode = res.getCode();

            logger.debug("call sendRedisInfo:", statusCode);
            if (res.statusCode != 200) {
                cb('HTTP ' + statusCode, res.getBody());
            } else {
                cb(null);
            }
        });
    };

    module.exports = InstanceCreatedCommand;

})();
