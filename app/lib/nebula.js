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

//
//
// function NebulaAgent() {
//
//     this.settings = {
//         api: {
//             container: config.apiRoot + '/api/containers',
//             process: config.apiRoot +
//                 '/api/containers/{containerId}/process/{id}'
//         },
//         conf: {
//             container: 'conf/container.json'
//         }
//     };
//
//     /**
//      * 初始化，需要先跟 R.P. 註冊，取得唯一性的 ID
//      * 之後呼叫 R.P. 的時候，會依照這個 ID 來判別是那一個 Client
//      */
//     this.init = function() {
//
//         // Check container.json exist, if not, call container api to register first
//         // and save container.json to conf
//         fs.readFile(this.settings.conf.container, 'utf-8', function(err,
//             data) {
//             if (err) {
//                 // call api to get container.json
//                 var options = {
//                     path: this.settings.api.container,
//                     method: 'POST'
//                 };
//                 console.log('options', options);
//
//                 var req = http.request(options, function(res) {
//                     console.log(
//                         'response from containerApi',
//                         res);
//                 });
//
//                 req.end();
//
//             } else {
//                 this.settings.containerId = data.containerId;
//             }
//         });
//     };
//
//     /**
//      * 與 Resource Provider 回報執行狀況
//      * @param {Boolean} isError 是否有錯誤
//      * @param {String}  stdout  stdout output
//      * @param {String}  stderr  stderr output
//      */
//     this.updateStatus = function(isError, stdout, stderr) {
//         // Send response to saas api, cause this is async call
//         // res.send((error !== null) ? 'failed' : 'ok');
//         var options = this.config.api || {
//             path: '',
//             method: 'POST'
//         };
//         console.log('options', options);
//
//         var req = http.request(options, function(res) {
//
//         });
//
//         // req.write(JSON.stringify({
//         //
//         // }));
//
//         req.end();
//     };
// }
//
// module.exports = new NebulaAgent();
