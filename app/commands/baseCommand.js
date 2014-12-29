/**
 * Created by rickychiang on 14/12/27.
 */

var requestify = require('requestify'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore');


(function() {

    // Constructor
    function BaseCommand() {}

    BaseCommand.prototype.execute = function() {
        // 1. Get Url
        // 2. Get Data
    };

    BaseCommand.prototype.setAgent = function(agent) {
        this.agent = agent;
    };



    /**
     * ContainerApi Delegate
     *
     * @param {[type]}   apiUri   [description]
     * @param {[type]}   method   [description]
     * @param {[type]}   data     [description]
     */
    BaseCommand.prototype.apiCall = function(apiUri, method, data) {

        data = data || {};
        method = method.toLowerCase();
        var delegateUri = config.settings.apiRoot + apiUri;

        var delegateMethod = requestify[method];
        if (delegateMethod == null) {
            // throw new Error(method + ' not exist!');
            this.agent.emit('error', 'apiCommand', method + ' not exist!');
        }

        if ('get' === method) {
            return delegateMethod.call(null, delegateUri);
        } else {
            return delegateMethod.call(null, delegateUri, data);
        }
    }

    // export the class
    module.exports = BaseCommand;

})();
