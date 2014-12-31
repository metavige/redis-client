/**
 * Redis Manager
 *
 * 用來管理 Redis/Sentinel/Proxy
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    path = require('path'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    spawn = require('child_process').spawn,
    _ = require("underscore");

(function() {

    function Adapter(agent) {

        Adapter.super_.call(this, {
            wildcard: true,
            delimiter: '::'
        });
        // =======================================================
        // Fields
        // =======================================================
        var _agent = agent,
            _self = this,
            logger = this.logger = agent.logger;

        // =======================================================
        // Public Methods
        // =======================================================

        /**
         * 利用 child_process.spawn 來執行命令列參數
         *
         * @param {String}   command  [description]
         * @param {Array}    args     [description]
         * @param {Function} callback [description]
         */
        this.spawnCommand = function(command, args, callback) {
            var child = spawn(command, args);
            logger.debug('spawn arguments:', args);

            var result = {
                out: null,
                err: null,
                cli: command,
                args: args
            };

            child.stdout.on('data', function(data) {
                result.out = '' + data;
                // logger.debug('execute process result: ', result.out);
            });

            child.stderr.on('data', function(data) {
                result.err = '' + data;
                logger.error('child process error: ', result.err);
            });

            child.on('close', function(code) {
                logger.info('執行 CLI 命令 :' + code);
                result.code = code;

                // 改變 callback 的回傳資料，改成跟 async 類似的方式
                // 為了統一所有的 callback 傳遞
                var err = (code == 0) ? null : code;
                callback(err, result);
            });
        };

        /**
         * 執行 redis-cli 指令
         *
         * @param {Number}   port     [description]
         * @param {String}   auth     [description]
         * @param {Array}    params   [description]
         * @param {Function} callback [description]
         */
        this.redisCli = function(port, auth, params, callback) {
            var redisCliParams = _.map(params, _.clone);
            _.each(['-p', port, '-a', auth].reverse(), function(v, k) {
                redisCliParams.unshift(v);
            });

            // logger.debug('redis-cli params:', redisCliParams);
            _self.spawnCommand('redis-cli', redisCliParams, callback);
            // _self.spawnCommand('redis-cli', redisCliParams, function(err, result) {
            //
            //     // var isSuccess = (err == null && /^OK/.test(result.out));
            //     callback(err, result);
            // });
        };

        /**
         * 執行 sentinel 的相關指令
         *
         * @param {Array}    params   [description]
         * @param {Function} callback [description]
         */
        this.sentinelCli = function(params, callback) {
            var sentinelParams = _.map(params, _.clone);
            sentinelParams.unshift('sentinel');
            // logger.debug('sentinel params:', sentinelParams);

            _self.redisCli(callback,
                config.settings.sentinel.port,
                config.settings.sentinel.auth,
                sentinelParams);
        };


        this.api = function() {
            var args = _.map(arguments);
            args[0] = 'container::' + args[0];

            logger.debug('call container api:', args);

            agent.emit.apply(agent, args);
        };

        // =======================================================
        // Events
        // =======================================================
        this.onAny(function() {

            var args = _.map(arguments);

            logger.debug('[MANAGER]', this.event, args);

            // 觸發錯誤事件
            if (this.event == 'error') {
                args.unshift(this.event);
                agent.emit.apply(agent, args);
                return;
            }

            // 事件名稱就是實際的 Command 名稱，
            // 執行 Command Handle
            try {
                var cmdName = this.event.replace('.', '/');
                var Command = getCommandClass(cmdName);
                if (Command !== null) {
                    new Command(_self).handle.apply(cmd, args);
                }
            } catch (ex) {
                agent.emit('error', cmdName, ex);
            }
        });

        // =======================================================
        // Internal Methods
        // =======================================================

        function getCommandClass(name) {
            try {
                logger.debug('prepare create command:', name);
                var Command = require(path.join(__dirname, name));

                return Command;
            } catch (ex) {
                logger.error('Command [' + name + '] 不存在或無法建立！');
                return null;
            }
        }

    }

    util.inherits(Adapter, EventEmitter2);

    // export adapter
    module.exports = Adapter;
})();
