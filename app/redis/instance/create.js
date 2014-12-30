/**
 * Redis Create Command
 *
 * 建立 Redis instance 的 Command
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    async = require('async'),
    redisInfo = require('redis-info'),
    _ = require("underscore");

(function() {

    function RedisCreateCommand(manager) {
        this.manager = manager;
    }

    RedisCreateCommand.prototype.handle = function(options, cb) {

        var _self = this,
            _manager = this.manager,
            logger = this.manager.logger;

        /** options sample:
        {
            id: 'containerProcessId',
            port: 'redis port',
            pwd: 'auth password',
            mem: 'allocate memory size'
        }
        */
        logger.debug(options);

        // command: redis-server --port 123 --maxmemory 128mb --requirepass 123 --daemonize yes

        var cmdArgs = ['--port', options.port,
            '--maxmemory', options.mem + 'mb',
            '--requirepass', options.pwd,
            '--daemonize', 'yes',
            '--pidfile', '/var/run/redis/redis-server-' + options.id + '.pid',
            '--logfile', '/var/log/redis/redis-' + options.id + '.log',
            '--dir', '/var/lib/redis',
            '--dbfilename', options.id + '.rdb'
        ];

        logger.debug('cmdArgs: ', cmdArgs);

        async.series([
            function(callback) {
                // 呼叫命令列，建立一個新的 redis-server instance
                _self.manager.spawnCommand('redis-server', cmdArgs,
                    function(code, result) {
                        logger.debug('spawnCommand callback:', arguments);
                        if (code == 0) {
                            logger.info('create redis server success !!!');
                        }

                        var error = ((code == 0) ? null : code);
                        // logger.debug('error', error);
                        callback(error, result);
                    });
            },
            function(callback) {
                logger.debug('update redis info status');

                // execute: redis-cli -p [port] -a [pwd] info
                _self.manager.redisCli(function(error, result) {
                    var sendData = {
                        id: options.id
                    };
                    if (error == null) {
                        var redisInfoData = redisInfo.parse(result.out);
                        // logger.debug('parse redisInfo: ', JSON.stringify(
                        //     redisInfoData));

                        sendData = _.extend(sendData, {
                            info: redisInfoData
                        });
                    } else {
                        sendData = _.extend(sendData, {
                            error: result.err
                        });
                    }
                    // containerApi.sendRedisInfo(sendData);

                    // 建立完成之後，呼叫 Api 回寫狀態
                    _manager.api('instance.created', sendData, callback);

                    callback(error);
                }, options.port, options.pwd, ['info']);
            }
        ], function(err, result) {
            // Report sentinel setting OK!
            if (err != null) {
                _self.manager.emit('error', 'create redis', result);
            }

            // 20141230 Ricky 加上一個 cb 回應
            // 為了 restart.js 做 async 處理用
            if (cb != null) {
                cb(err, result);
            }
        });
    }

    module.exports = RedisCreateCommand;
})();
