/**
 * Command Base Class
 *
 * Created by rickychiang on 14/12/30.
 */

// =======================================================
// Module dependencies
// =======================================================
var requestify = require('requestify'),
    logger = require('../base/logger');

(function() {

    function BaseCommand(proxy) {
        this.proxy = proxy;
        this.logger = logger;

        this.getContainerApi = function(apiUri) {
            return proxy.agent.getContainerApi(apiUri);
        }
    }

    /**
     * ContainerApi Delegate
     *
     * @param {String}   apiUri   API 相對網址
     * @param {String}   method   HTTP Request Method
     * @param {Object}   data     Request Body
     *
     * @return {Promise} 回傳一個 Promise 物件
     */
    BaseCommand.prototype.callApi = function(apiUri, method, data) {
        data = data || {};
        method = method.toLowerCase();
        var delegateUri = this.getContainerApi(apiUri),
            responseMethod = this.response,
            _self = this;

        var delegateMethod = requestify[method];
        if (delegateMethod === null) {
            throw new Error(method + ' not exist!');
        }

        var promise = null;
        if ('get' === method || data === null) {
            promise = delegateMethod.call(null, delegateUri)
        } else {
            promise = delegateMethod.call(null, delegateUri, data)
        }

        return promise;
    };

    module.exports = BaseCommand;
})();
