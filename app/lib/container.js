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
    register: '/api/containers',
    redisInfo: '/api/containers/%s/process/%s',
    updateSentinelStatus: '/api/containers/%s/sentinels/%s',
    updateProxyStatus: '/api/containers/%s/proxies/%s',
    switchMaster: '/api/redisInfos/%s/switchMaster'
};

/**
 * 註冊 Container
 */
redisContainerApi.registerContainer = function() {
    logger.info('register contianer.....', containersApi.register);

    var containerRegisterData = {
        hostname: require('os').hostname(),
        type: config.settings.type
    };

    callContainerApi(containersApi.register, 'POST', containerRegisterData)
        .then(function(res) {
            logger.debug(res);
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

        callContainerApi(url, 'PUT', redisInfo).then(function(res) {

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

    callContainerApi(url, 'PUT', sentinelStatus).then(function(res) {

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
    callContainerApi(url, 'PUT', status).then(function(res) {

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

/**
 * Call ContainerApi, trigger switch redis master
 * @param {[type]} eventData [description]
 */
redisContainerApi.switchMaster = function(eventData) {

    var url = util.format(containersApi.switchMaster, eventData['master-name']);
    logger.info('Call switch master url:', url);

    callContainerApi(url, 'POST', eventData)
        .then(function(res) {
            logger.debug(res);
        });
}

if (_.isUndefined(config.settings.container)) {
    logger.debug('Prepare register container.....');
    redisContainerApi.registerContainer();
}

// 20141210 add container api ping, for wake up container api
var pingInterval = 6000 * 5;
var timeoutId = setTimeout(pingContainer, pingInterval);

function pingContainer() {
    try {
        callContainerApi('/api/ping', 'GET').then(function(res) {
            var statusCode = res.getCode();
            if (statusCode != 200) {
                logger.error('ping container error: ', statusCode, res.body);
            }

            timeoutId = setTimeout(pingContainer, pingInterval);
        });
    } catch (ex) {
        logger.error('send ping error!', ex);
    }
};

/**
 * ContainerApi Delegate
 *
 * @param {[type]}   apiUri   [description]
 * @param {[type]}   method   [description]
 * @param {[type]}   data     [description]
 */
function callContainerApi(apiUri, method, data) {
    data = data || {};
    method = method.toLowerCase();
    var delegateUri = config.settings.apiRoot + apiUri;

    var delegateMethod = requestify[method];
    if (delegateMethod == null) {
        throw new Error(method + ' not exist!');
    }

    if ('get' === method) {
        return delegateMethod.call(null, delegateUri);
    } else {
        return delegateMethod.call(null, delegateUri, data);
    }
}
