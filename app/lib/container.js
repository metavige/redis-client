/**
    定義與 Resource Client 回報的方法

    author: ricky.chiang@quantatw.com
    date: 2014/11/12
 */

var requestify = require('requestify'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore');

var config = require(path.join(__dirname, '/config'));
var logger = require(path.join(__dirname, '/logger'));

var redisContainerApi = module.exports = {};

var containersApi = {
    register: config.settings.apiRoot + '/api/containers',
    redisInfo: config.settings.apiRoot + '/api/containers/%s/process/%s',
    updateSentinelStatus: config.settings.apiRoot + '/api/containers/%s/sentinels/%s',
    updateProxyStatus: config.settings.apiRoot + '/api/containers/%s/proxies/%s',
};

/**
 * 註冊 Container
 */
redisContainerApi.registerContainer = function() {
    logger.info('register contianer.....', containersApi.register);

    requestify
        .post(containersApi.register, {
            hostname: require('os').hostname(),
            type: config.settings.type
        })
        .then(function(res) {
            try {
                var statusCode = res.getCode();
                if (statusCode == 404) {
                    logger.error(
                        'register container faile, wrong api: ',
                        containersApi.register);
                    throw new Error('can\'t register container');
                }
                var reqBody = res.getBody();
                logger.debug('Request Body:' + JSON.stringify(reqBody));

                if (statusCode == 200 || statusCode == 201) {
                    config.settings.container = _.extend(config.settings.container || {}, {
                        id: reqBody.containerId
                    });

                    logger.info('config.settings.....', JSON.stringify(config.settings));

                    // if this container is proxy, need set sentinel port, auth
                    if (config.settings.type === 'proxy') {
                        config.settings.sentinel = _.extend(reqBody.sentinel || {});
                    }

                    logger.info('save config.....', JSON.stringify(config.settings));
                }

                logger.debug('response:', statusCode, reqBody);
                // logger.debug(res.body);

            } catch (ex) {
                logger.error('register error: ', ex);
            }
        });
};

/**
 * 更新 Redis 狀態，表示建立 Redis 成功
 *
 * @param {Boolean} redisInfo [description]
 */
redisContainerApi.sendRedisInfo = function(redisInfo) {
    /**
     * 網址組合成 api/containers/{containerId}/process/{processId}
     */
    if (redisInfo !== null) {

        var url = util.format(containersApi.redisInfo,
            config.settings.container.id,
            redisInfo.id);

        logger.debug('call redis update status api: ', url);
        requestify
            .put(url, redisInfo)
            .then(function(res) {
                logger.debug(res);
                try {
                    logger.debug("call sendRedisInfo:", res.getCode());
                    // logger.debug('response:', res.getBody());
                    // logger.debug(res.body);
                } catch (ex) {
                    logger.error('sendRedisInfo: ', ex);
                    // TODO:
                }
            });
    }
};

/**
 * sentinel 建立成功，更新狀態
 *
 * @param {Object} sentinelStatus sentinel 狀態
 */
redisContainerApi.updateSentinelStatus = function(resId, procId, sentinelStatus) {

    var url = util.format(containersApi.updateSentinelStatus,
        config.settings.container.id,
        procId);

    logger.debug('update sentinel status: ', url);
    requestify
        .put(url, sentinelStatus)
        .then(function(res) {
            logger.debug(res);
            try {
                logger.debug("call update sentinel:", res.getCode());
                // logger.debug('response:', res.getBody());
                // logger.debug(res.body);
            } catch (ex) {
                logger.error('update sentinel status: ', ex);
                // TODO:
            }
        });

};

/**
 * proxy 建立成功，更新狀態
 *
 * @param {[type]} resId  [description]
 * @param {[type]} procId [description]
 * @param {[type]} status [description]
 */
redisContainerApi.updateProxyStatus = function(resId, procId, status) {

    var url = util.format(containersApi.updateProxyStatus,
        config.settings.container.id,
        procId);

    logger.debug('update proxy status: ', url);
    requestify
        .put(url, status)
        .then(function(res) {
            logger.debug(res);
            try {
                logger.debug("call update proxy:", res.getCode());
                // logger.debug('response:', res.getBody());
                // logger.debug(res.body);
            } catch (ex) {
                logger.error('update proxy status: ', ex);
                // TODO:
            }
        });
};

if (_.isUndefined(config.settings.container)) {
    redisContainerApi.registerContainer();
}
