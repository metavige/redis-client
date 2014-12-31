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
    path = require('path'),
    redisInfo = require('redis-info'),
    _ = require("underscore"),
    BaseCliCommand = require(path.join(__dirname, '../baseCliCommand'));

(function() {

    function RedisCreateCommand(manager) {
        RedisCreateCommand.super_.call(this, manager);
    }

    util.inherits(RedisCreateCommand, BaseCliCommand);

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

        async.series({
            newInstance: function(callback) {
                // 呼叫命令列，建立一個新的 redis-server instance
                _self.spawnCommand('redis-server', cmdArgs,
                    function(err) {
                        if (err == null) {
                            logger.info('建立一個新的 Redis !!!');
                        }

                        // var error = ((code == 0) ? null : code);
                        // logger.debug('error', error);
                        callback(err);
                    });
            },
            info: function(callback) {
                logger.debug('取得 Redis info 命令的資料');

                // execute: redis-cli -p [port] -a [pwd] info
                _self.redisCli(options.port, options.pwd, ['info'],
                    function(err, result) {
                        var sendData = {
                            id: options.id
                        };
                        if (err == null) {
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
                    });
            }
        }, function(err, result) {
            logger.debug('create callback:', err, result);

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
