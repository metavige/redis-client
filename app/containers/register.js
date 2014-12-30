/**
 * Resource Container Register
 *
 * 呼叫 ContainerApi 做註冊 Container
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var BaseCommand = require('./baseCommand'),
    util = require('util'),
    _ = require('underscore');

(function() {

    function RegisterContainerCommand(proxy) {
        // call super ctor
        RegisterContainerCommand.super_.call(this, proxy);
    }
    util.inherits(RegisterContainerCommand, BaseCommand);

    /**
     * 註冊 Resource Container
     *
     * @param  {Object}   data { hostname, type }
     * @param  {Function} cb   callback function
     */
    RegisterContainerCommand.prototype.handle = function(data, cb) {

        var logger = this.logger,
            agent = this.proxy.agent,
            apiPath = '/api/containers';

        logger.info('Register Container....', data);

        this.callApi(apiPath, 'POST', data).then(function(res) {

            logger.debug('register container:', res);

            var statusCode = res.getCode(),
                resBody = res.getBody();

            if (statusCode !== 200 && statusCode !== 201) {
                logger.error(
                    'register container error',
                    statusCode);
                // _self.proxy.emit('error', 'container register', statusCode);

                // 回傳 HTTP statusCode，表示有錯誤
                cb('HTTP ' + statusCode, resBody);
            } else {
                var sentinelInfo = {},
                    containerInfo = {
                        id: resBody.containerId,
                        type: resBody.containerType,
                        processes: resBody.processes
                    };

                // if this container is proxy, need set sentinel port, auth
                if (agent.isProxy()) {
                    sentinelInfo = _.extend(resBody.sentinel || {});
                }

                // 回復設定
                cb(null, containerInfo, sentinelInfo);
            }
        });
    };

    module.exports = RegisterContainerCommand;

})();
