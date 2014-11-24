/**
    定義與 Resource Client 回報的方法

    author: ricky.chiang@quantatw.com
    date: 2014/11/12
 */

var requestify = require('requestify'),
    util = require('util'),
    _ = require('underscore');
// var http = require('http');
// var fs = require('fs');
var config = require('./config');

var redisContainerApi = module.exports = {};

var containersApi = {
    register: config.settings.apiRoot + '/api/containers',
    redisInfo: config.settings.apiRoot + '/api/containers/%s/process/%s'
};
// var http = require('http');

/**
 * 註冊 Container
 */
redisContainerApi.registerContainer = function() {

    requestify
        .post(containersApi.register, {
            hostname: require('os').hostname(),
            type: config.settings.type
        })
        .then(function(res) {
            try {
                if (res.getCode() == 200) {
                    config.container = _.extend(config.container || {}, {
                        id: res.getBody().containerId
                    });
                    console.log('save config.....', config.container);
                }

                console.log('response:', res.getBody());
                console.log(res.body);
            } catch (ex) {
                console.log(ex);
            }
        });
};

redisContainerApi.sendRedisInfo = function(redisInfo) {
    /**
     * 網址組合成 api/containers/{containerId}/process/{processId}
     */
    if (redisInfo != null) {

        var url = util.format(containersApi.redisInfo,
            config.container.id,
            redisInfo.id);

        console.log('call redis update status api: ', url);
        requestify
            .put(url, redisInfo)
            .then(function(res) {
                console.log(res);
                try {
                    console.log("call sendRedisInfo:", res.getCode());
                    console.log('response:', res.getBody());
                    // console.log(res.body);
                } catch (ex) {
                    console.error(ex);
                }
            });
    }
};

if (_.isUndefined(config.container)) {
    redisContainerApi.registerContainer();
}
