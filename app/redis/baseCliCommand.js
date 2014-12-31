/**
 * Base CliCommand
 *
 * 簡單的 Cli (spawn) 命令執行的 Base Command Class
 *
 * Created by rickychiang on 14/12/31.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    path = require('path'),
    EventEmitter2 = require('eventemitter2').EventEmitter2,
    spawn = require('child_process').spawn,
    logger = require(path.join(__dirname, '../base/logger')),
    _ = require("underscore");

(function() {

    function BaseCliCommand(manager) {
        this.manager = manager;
        this.agent = manager.agent;
    }

    /**
     * 利用 child_process.spawn 來執行命令列參數
     *
     * @param {String}   command  [description]
     * @param {Array}    args     [description]
     * @param {Function} callback [description]
     */
    BaseCliCommand.prototype.spawnCommand = function(command, args, callback) {
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
    BaseCliCommand.prototype.redisCli = function(port, auth, params, callback) {
        var redisCliParams = _.map(params, _.clone);
        _.each(['-p', port, '-a', auth].reverse(), function(v, k) {
            redisCliParams.unshift(v);
        });

        // logger.debug('redis-cli params:', redisCliParams);
        this.spawnCommand('redis-cli', redisCliParams, callback);
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
    BaseCliCommand.prototype.sentinelCli = function(params, callback) {
        var sentinelParams = _.map(params, _.clone);
        sentinelParams.unshift('sentinel');
        // logger.debug('sentinel params:', sentinelParams);
        var sentinelConfig = this.agent.getSentineConfig();
        logger.debug('sentinel config:', sentinelConfig);

        this.redisCli(callback,
            sentinelConfig.port,
            sentinelConfig.auth,
            sentinelParams);
    };

    module.exports = BaseCliCommand;

})();
