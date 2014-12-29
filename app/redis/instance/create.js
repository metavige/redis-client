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
    _ = require("underscore");

(function() {

    function RedisCreateCommand(manager) {
        this.manager = manager;
    }

    RedisCreateCommand.prototype.handle = function(options) {

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
        console.log(options);

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
                        if (code === 0) {
                            logger.info('create redis server success !!!');
                        }

                        callback((code === 0) ? null : result);
                    });
            },
            function(callback) {
                logger.debug('update redis info status');

                // execute: redis-cli -p [port] -a [pwd] info
                _self.manager.redisCli(function(error, result) {
                    var sendData = {
                        id: options.id
                    };
                    if (error === null) {
                        var redisInfoData = redisInfo.parse(result.out);
                        logger.debug('parse redisInfo: ', JSON.stringify(
                            redisInfoData));

                        sendData = _.extend(sendData, {
                            info: redisInfoData
                        });
                    } else {
                        sendData = _.extend(sendData, {
                            error: result.err
                        });
                    }
                    // containerApi.sendRedisInfo(sendData);

                    // call container api
                    _manager.api('redis.created', sendData,
                        function() {

                        });


                    callback(error);
                }, options.port, options.pwd, ['info']);
            }
        ], function(err, result) {
            // Report sentinel setting OK!
            if (err != null) {
                _self.manager.emit('error', 'create redis', result);
            }
        });
    }

    module.exports = RedisCreateCommand;
})();
