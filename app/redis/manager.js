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
            _self = this;

        var logger = this.logger = agent.logger;
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
                logger.info('child process exited with code ' + code);
                result.code = code;

                // TODO: 改變 callback 的回傳資料，改成跟 async 類似的方式
                // 為了統一所有的 callback 傳遞
                callback(code, result);
            });
        };

        /**
         * 執行 redis-cli 指令
         *
         * @param {Function} callback [description]
         * @param {Number}   port     [description]
         * @param {String}   auth     [description]
         * @param {Array}    params   [description]
         */
        this.redisCli = function(callback, port, auth, params) {
            var redisCliParams = _.map(params, _.clone);
            _.each(['-p', port, '-a', auth].reverse(), function(v, k) {
                redisCliParams.unshift(v);
            });

            // logger.debug('redis-cli params:', redisCliParams);

            _self.spawnCommand('redis-cli', redisCliParams, function(code, result) {
                callback((code === 0 && /^OK/.test(result.out)) ? null : result
                    .err, result);
            });
        };

        /**
         * 執行 sentinel 的相關指令
         *
         * @param {Function} callback [description]
         * @param {Array}    params   [description]
         */
        this.sentinelCli = function(callback, params) {
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

            var args = _.map(arguments),
                cmdName = this.event.replace('.', '/');

            console.log('[MANAGER]', this.event, args);

            if (this.event == 'error') {
                args.unshift(this.event);
                agent.emit.apply(agent, args);
                return;
            }

            // console.log('[MANAGER]', args);

            try {
                var Command = require('./' + cmdName);

                var cmd = new Command(_self);
                cmd.handle.apply(cmd, args);
            } catch (ex) {
                agent.emit('error', cmdName, ex);
            }
        });

        // this.on('instance.create', function() {
        //     var args = _.map(arguments);
        //
        //     console.log('[MANAGER]', args);
        //     var Command = require('./instance/create');
        //
        //     try {
        //         var cmd = new Command(_self);
        //         cmd.handle.apply(cmd, args);
        //     } catch (ex) {
        //         agent.emit('error', 'Redis Instance Create', ex);
        //     }
        // });
        //
        // this.on('sentinel.monitor', function() {
        //     var Command = require('./sentinel/monitor');
        //
        //     try {
        //         var cmd = new Command(_self);
        //         cmd.handle.call(cmd, arguments);
        //     } catch (ex) {
        //         agent.emit('error', 'Sentinel Monitor', ex);
        //     }
        // });
        //
        // this.on('proxy.create', function() {
        //     var Command = require('./proxy/create');
        //
        //     try {
        //         var cmd = new Command(_self);
        //         cmd.handle.call(cmd, arguments);
        //     } catch (ex) {
        //         agent.emit('error', 'Redis Proxy Create', ex);
        //     }
        // });

        // this.on('error', function() {
        //     var args = _map(arguments);
        //     args.unshift('error');
        //
        //     agent.emit.apply(agent, args);
        // });
        // =======================================================
        // Internal Methods
        // =======================================================

        function createCommand(name) {

        }

    }

    util.inherits(Adapter, EventEmitter2);

    // export adapter
    module.exports = Adapter;
})();
