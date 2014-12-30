/**
 * Proxy 狀態更新 Api
 *
 * 呼叫 ContainerApi 做回報 Proxy 設定已經建立的狀態更新
 *
 * Created by rickychiang on 14/12/30.
 */

// =======================================================
// Module dependencies
// =======================================================
var BaseCommand = require('../baseCommand'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore');

(function() {

    function ProxyStatusUpdatedCommand(proxy) {
        // call super ctor
        ProxyStatusUpdatedCommand.super_.call(this, proxy);
    }
    util.inherits(ProxyStatusUpdatedCommand, BaseCommand);

    /**
     * 呼叫 Container Api, 更新 Proxy 狀態
     *
     * @param  {Object}   data { id, resId, status }
     * @param  {Function} cb   callback function
     */
    ProxyStatusUpdatedCommand.prototype.handle = function(data, cb) {

        // 網址組合成 api/containers/{containerId}/proxy/{processId}
        var url = path.join('/api/containers',
            this.proxy.agent.getId(),
            'proxy',
            data.id);

        logger.debug('update proxy status: ', url, data);

        this.callApi(url, 'PUT', data.status).then(function(res) {

            var statusCode = res.getCode();

            logger.debug('ProxyStatusUpdatedCommand', statusCode);
            if (res.statusCode != 200) {
                cb('HTTP ' + statusCode, res.getBody());
            } else {
                cb(null);
            }
        });
    };

    module.exports = ProxyStatusUpdatedCommand;
})();
