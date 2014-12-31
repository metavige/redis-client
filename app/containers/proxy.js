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
var util = require('util'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    path = require('path'),
    _ = require('underscore');

(function() {


    function Proxy(agent) {

        var _agent = this.agent = agent,
            _self = this,
            logger = agent.logger;

        Proxy.super_.call(this, {
            wildcard: true,
            delimiter: '::'
        });

        // =======================================================
        // Listeners
        // =======================================================
        this.onAny(function(data, cb) {
            var args = _.map(arguments);

            if (this.event === 'error') {
                // call agent error event
                args.unshift(this.event);
                agent.emit.apply(agent, args);
                return;
            }

            try {
                var cmdName = './' + this.event.replace('.', '/');

                // Call Command .....
                var cmd = CreateCommand(cmdName, _self);

                cmd.handle.call(cmd, data, cb);
            } catch (ex) {
                console.log('RunCommand Error', cmdName, ex);
                // error raise
                args.unshift('error');

                agent.emit.apply(agent, args);

                cb(ex);
            }
        });

        // =======================================================
        // Private Methods
        // =======================================================
        function CreateCommand(cmdName, proxy) {
            logger.debug('Create Proxy Command: ', cmdName);
            var Command = require(path.join(__dirname, cmdName));

            return new Command(proxy);
        }
    }

    util.inherits(Proxy, EventEmitter2);

    // export proxy
    module.exports = Proxy;
})();
