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
    _ = require('underscore'),
    logger = require('./logger');

(function() {

    var Config = function(agent) {

        // =======================================================
        // Fields
        // =======================================================
        var _self = this,
            _settings = {},
            configPath = path.join(__dirname, '../../conf/config.json'),
            _isContainreAgentStarted = false;

        // =======================================================
        // Public Methods
        // =======================================================
        this.init = function() {

            // read conf/config.json
            try {
                // console.log(__dirname);
                var data = fs.readFileSync(configPath, 'utf8');
                logger.info('read config.json', data);

                _settings = JSON.parse(data.toString());
            } catch (err) {
                agent.emit('error', 'config', err);
            }

            logger.info('config inited.....');

            if (_self.container == null) {
                try {
                    RegisterContainer();
                } catch (ex) {
                    agent.emit('fatal', ex);
                }
            }

        };

        this.isProxy = function() {
            return (_settings.type === 'proxy');
        };

        this.getContainerId = function() {
            return _settings.container.id;
        };

        this.getType = function() {
            return _settings.type;
        };

        this.getSetting = function() {
            return _.clone(_setttings);
        };

        this.getSentinelConfig = function() {
            return _.clone(_settings.sentinel);
        };

        this.getContainerApi = function(apiPath) {
            return _settings.apiRoot + apiPath;
        };

        this.addProcess = function(process) {
            _settings.container.processes.push(process);
        };
        // =======================================================
        // Private Methods
        // =======================================================
        function RestartProcesses(processes) {

            // 註冊的時候，順便檢查是否有需要重新啟動之前已經建立的 Instance?
            // Prepare restart redis instance
            if (!_.isArray(_settings.container.processes)) return;

            var processes = _settings.container.processes;

            _.each(processes, function(v) {
                // 呼叫 Redis Manager 去重新建立 Redis
                agent.emit(
                    'redis::instance.restart',
                    v);
            });
        }

        /**
         * 註冊 ResourceContainer
         */
        function RegisterContainer() {

            var containerRegisterData = {
                hostname: require('os').hostname(),
                type: _settings.type
            };

            // call containerApi to register
            agent.emit('container::register',
                containerRegisterData,
                ContainerRegisterCallback);
        }

        /**
         * Register Callback
         * @param {[type]} err [description]
         */
        function ContainerRegisterCallback(err) {
            logger.debug('return from container api', arguments);

            if (err == null) {
                var containerData = arguments[1],
                    sentinelData = arguments[2],
                    processes = arguments[3];

                logger.debug('return from register container api',
                    containerData, sentinelData);

                _settings.container = _.extend(_settings.container || {},
                    containerData);

                if (_self.isProxy()) {
                    _settings.sentinel = sentinelData || {};
                }

                RestartProcesses();

                console.log('settings: ', _settings);
            } else {
                logger.error('register container error',
                    error,
                    arguemnts[1]); // print res.body
                process.exit(1);
            }
        }
    }

    module.exports = Config;
})();
