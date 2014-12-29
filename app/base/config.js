/**
 * Config class
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var fs = require('fs'),
    path = require('path'),
    _ = require('underscore');

(function() {

    var Config = function(agent) {

        var _self = this,
            _settings = {},
            configPath = path.join(__dirname, '../../conf/config.json'),
            _isContainreAgentStarted = false;

        /**
         * config init
         * @return {[type]} [description]
         */
        this.init = function() {

            // read conf/config.json
            try {
                // console.log(__dirname);
                var data = fs.readFileSync(configPath, 'utf8');
                agent.logger.info('read config.json', data);

                _settings = JSON.parse(data.toString());
            } catch (err) {
                agent.emit('error', 'config', err);
            }

            agent.logger.info('config inited.....');

            if (_self.container == null) {
                // call containerApi to register
                agent.emit('container::register', _settings,
                    function(containerData) {
                        agent.logger.debug('return from register container api',
                            containerData);
                        _self.container = containerData;
                    });
            }
        };

        this.isProxy = function() {
            return (_settings.type === 'proxy');
        };

        this.getSetting = function() {
            return _.clone(_setttings);
        };
    }

    module.exports = Config;
})();
