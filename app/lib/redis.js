/**
    Redis Adapter, for redis process creation, test

    author: ricky.chiang@quantatw.com
    date: 2014/11/12

 */

var path = require('path'),
    exec = require('child_process').exec,
    spawn = require('child_process').spawn,
    RedisSentinel = require('redis-sentinel-client'),
    util = require('util'),
    async = require('async'),
    _ = require("underscore"),
    redisInfo = require('redis-info');

var config = require(path.join(__dirname, '/config'));
var containerApi = require(path.join(__dirname, './container'));
var logger = require(path.join(__dirname, './logger'));

// Define bash command
var commands = {
    redis: {
        create: 'redis-server --port %d --maxmemory %dmb --requirepass %s --daemonize yes',
        info: 'redis-cli -p %d -a %s info',
        pid: 'ps -A -f | grep redis-server |  grep "*:%d" | awk \'{print $2}\'',
        cofig: 'config set %s %s'
    },
    sentinel: {
        monitor: 'redis-cli -p %d -a %s',
        start: path.join(__dirname, 'bin/start-sentinel') + ' %s'
    },
    proxy: {
        start: path.join(__dirname, 'bin/start-twemproxy') + ' %s %s %s'
    }
};

var sentinelConfig = {
    port: 26379 // Default Setting, call ps to grap port
};

/**
 * Use child_process.spawn to execute command
 *
 * @param {String}   command  [description]
 * @param {Array}    args     [description]
 * @param {Function} callback [description]
 */
function spawnCommand(command, args, callback) {
    var child = spawn(command, args);

    var result = {
        out: null,
        err: null
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

        callback(code, result);
    });
}

/**
 * Run Redis cli command
 *
 * @param {Function} callback [description]
 * @param {Number}   port     [description]
 * @param {String}   auth     [description]
 * @param {Array}    params   [description]
 */
function redisCli(callback, port, auth, params) {
    var redisCliParams = _.map(params, _.clone);
    _.each(['-p', port, '-a', auth].reverse(), function(v, k) {
        redisCliParams.unshift(v);
    });

    // logger.debug('redis-cli params:', redisCliParams);

    spawnCommand('redis-cli', redisCliParams, function(code, result) {
        if (code == 0 && /^OK/.test(result.out)) {
            callback(null, result);
        }
    });
}

/**
 * Run Sentinel Cli Command
 *
 * @param {Function} callback [description]
 * @param {Array}    params   [description]
 */
function sentinelCli(callback, params) {
    var sentinelParams = _.map(params, _.clone);
    sentinelParams.unshift('sentinel');
    // logger.debug('sentinel params:', sentinelParams);

    redisCli(callback,
        config.settings.sentinel.port,
        config.settings.sentinel.auth,
        sentinelParams);
}

// var redis = require('redis');

var redisAdapter = module.exports = {};

/**
 * 建立一個新的 Redis Instance
 *
 * @param  {Object}   options  Redis Instance option
 * @return {[type]}            [description]
 */
redisAdapter.newRedis = function(options) {

    /** options sample:
        {
            id: 'containerProcessId',
            port: 'redis port',
            pwd: 'auth password',
            mem: 'allocate memory size'
        }
    */

    // command: redis-server --port 123 --maxmemory 128mb --requirepass 123 --daemonize yes

    var cmdArgs = ['--port', options.port,
        '--maxmemory', options.mem + 'mb',
        '--requirepass', options.pwd,
        '--daemonize', 'yes'
    ];

    async.series([
        function(callback) {
            spawnCommand('redis-server', cmdArgs, function(code, result) {
                if (code == 0 && /^OK/.test(result.out)) {
                    logger.info('create redis server success !!!');
                    callback(null);
                }
            });
        },
        function(callback) {
            // Call Redis Info Update
            redisCli(function(error, result) {
                var sendData = {
                    id: option.id
                };
                if (error == null) {
                    var redisInfoData = redisInfo.parse(result.out);

                    containerApi.sendRedisInfo(_.extend(sendData, {
                        info: redisInfoData
                    }));

                    callback(null);
                } else {
                    containerApi.sendRedisInfo(_.extend(sendData, {
                        error: result.error
                    }));

                    callback(result.error);
                }
            }, options.port, optinos.pwd, ['info']);
        }
    ], function(err, result) {
        // Report sentinel setting OK!
        if (err == null) {
            logger.info('redis-server create ok !!!');
        }
    });
};

/**
 * initial sentinel monitor
 *
 * @param {String} monitorName  Sentinel monitor name (Maybe ResId)
 * @param {String} masterHost   Redis master host ip
 * @param {Number} masterPort   Redis master port
 * @param {String} auth         Master authorize password
 * @param {Number} quorum       master quorum
 */
redisAdapter.addSentinelMonitor = function(monitorName, masterHost, masterPort, auth, quorum) {

    // command: redis-cli -p [sentinelPort] sentinel monitor [monitorName] [masterHost] [masterPort] [quorum]
    // command: redis-cli -p [sentinelPort] sentinel set [monitorName] [configOption] [configValue]
    //  configOptions : down-after-milliseconds, failover-timeout, parallel-syncs, auth-pass
    var allConfigOptions = {
        'down-after-milliseconds': 5000,
        'failover-timeout': 5000,
        'parallel-syncs': 1
    };

    async.series([
        function(callback) {
            // setup Monitor first
            sentinelCli(callback, ['monitor',
                monitorName,
                masterHost,
                masterPort,
                quorum
            ]);
        },
        function(callback) {
            // SET MASTER AUTH
            sentinelCli(callback, ['set', monitorName, 'auth-pass', auth]);
        },
        function(callback) {
            // Config .....
            var configs = [];
            _.each(allConfigOptions, function(v, k) {
                sentinelCli(callback, ['set', monitorName, k, v]);
            });

            async.series(configs, callback);
        }

    ], function(err, result) {
        // Report sentinel setting OK!
        if (err == null) {
            logger.info('sentinel monitor ok !!!');
        }
    });
};
