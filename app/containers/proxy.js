/**
 * Container Api proxy
 *
 * 這是與 Redis Container Api 之間溝通的 Proxy
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var requestify = require('requestify'),
    util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    path = require('path'),
    _ = require('underscore');

(function() {

    function Proxy(agent) {

        var _agent = agent;


    }

    util.inherits(Proxy, EventEmitter2);

    // export proxy
    module.exports = Proxy;
})();
