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

        var _agent = agent,
            _self = this;

        Proxy.super_.call(this, {
            wildcard: true,
            delimiter: '::'
        });

        this.onAny(function(data, cb) {

            try {
                var args = _.map(arguments),
                    cmdName = './' + this.event.replace('.', '/');

                // Call Command .....
                CreateCommand(cmdName, _self).handle(data, cb);
            } catch (ex) {
                // error raise
                agent.emit('error', this.event, args);
            }
        });

        function CreateCommand(cmdName) {
            agent.logger.debug('Create Proxy Command: ', cmdName);
            var Command = require(path.join(__dirname, cmdName));

            return new Command(_self);
        }
    }

    util.inherits(Proxy, EventEmitter2);

    // export proxy
    module.exports = Proxy;
})();
