/**
    Redis Adapter, for redis process creation, test

    author: ricky.chiang@quantatw.com
    date: 2014/11/12

 */

var path = require('path'),
    spawn = require('child_process').spawn,
    async = require('async'),
    _ = require("underscore"),
    redisInfo = require('redis-info'),
    Docker = require('dockerode');

var docker = new Docker({
    socketPath: '/var/run/docker.sock'
});
var config = require(path.join(__dirname, '/config'));
var containerApi = require(path.join(__dirname, './container'));
var logger = require(path.join(__dirname, './logger'));

// Bash command sample reference
/*
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
*/

/**
 * Use child_process.spawn to execute command
 *
 * @param {String}   command  [description]
 * @param {Array}    args     [description]
 * @param {Function} callback [description]
 */
function spawnCommand(command, args, callback) {
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
        callback((code === 0 && /^OK/.test(result.out)) ? null : result.err, result);
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
        '--daemonize', 'yes',
        '--pidfile', '/var/run/redis/redis-server-' + options.id + '.pid',
        '--logfile', '/var/log/redis/redis-' + options.id + '.log',
        '--dir', '/var/lib/redis',
        '--dbfilename', options.id + '.rdb'
    ];

    async.series([
        function(callback) {
            spawnCommand('redis-server', cmdArgs, function(code, result) {
                if (code === 0) {
                    logger.info('create redis server success !!!');
                    callback(null);
                }
            });
        },
        function(callback) {
            logger.debug('update redis info status');
            // Call Redis Info Update
            redisCli(function(error, result) {
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
                containerApi.sendRedisInfo(sendData);

                callback(error);
            }, options.port, options.pwd, ['info']);
        }
    ], function(err, result) {
        // Report sentinel setting OK!
        if (err === null) {
            logger.info('redis-server create ok !!!');
        }
    });
};

/**
 * 透過 sentinel 的指令，將 Redis Master 加入 sentinel 管理
 *
 * @param {Object} sentinelData  Sentinel Data
 */
redisAdapter.addSentinelMonitor = function(resId, procId, sentinelData) {

    // sentinelData.name,
    // sentinelData.ip,
    // sentinelData.port,
    // sentinelData.pwd,
    // sentinelData.quorum
    // sentinelData.procId

    // command: redis-cli -p [sentinelPort] sentinel monitor [monitorName] [masterHost] [masterPort] [quorum]
    // command: redis-cli -p [sentinelPort] sentinel set [monitorName] [configOption] [configValue]
    //  configOptions : down-after-milliseconds, failover-timeout, parallel-syncs, auth-pass
    var allConfigOptions = {
        'down-after-milliseconds': 5000,
        'failover-timeout': 5000,
        'parallel-syncs': 1,
        'client-reconfig-script': '/usr/local/bin/reconfigure'
    };

    async.series([
        function(callback) {
            // setup Monitor first
            sentinelCli(callback, ['monitor',
                sentinelData.name,
                sentinelData.ip,
                sentinelData.port,
                sentinelData.quorum
            ]);
        },
        function(callback) {
            // SET MASTER AUTH
            sentinelCli(callback, ['set', sentinelData.name, 'auth-pass', sentinelData.pwd]);
        },
        function(callback) {
            // Config .....
            var configs = [];
            _.each(allConfigOptions, function(v, k) {
                sentinelCli(callback, ['set', sentinelData.name, k, v]);
            });

            async.series(configs, callback);
        },
        function(callback) {

            var result = {
                code: 0,
                out: '',
                err: '',
                cli: '',
                args: []
            };

            logger.info('call containerApi to update sentinel status', result);
            // Call Sentine Api report status
            containerApi.updateSentinelStatus(resId, procId, result);

            callback(null, result);
        }
    ]);
};

/**
 * 建立 Proxy
 *
 * @param {[type]} resId    [description]
 * @param {[type]} procId   [description]
 * @param {[type]} port     [description]
 * @param {[type]} statPort [description]
 */
redisAdapter.createTwemProxy = function(resId, procId, port, statPort) {

    logger.debug('run twemproxy init:', arguments);

    // var cmdArgs = [path.join(__dirname, '../../bin/start-twemproxy'), resId, port, statPort];

    // spawnCommand('sh', cmdArgs, function(code,
    //     result) {
    //     if (code == 0) {
    //         logger.info('create twemproxy success !!!');
    //     }

    //     logger.debug('create twemproxy result:', result);
    //     // TODO: Error Callback!?
    //     //
    //     containerApi.updateProxyStatus(resId, procId, result);
    // });

    /**
     *  1. 設定 twemproxy 的 port 給 ETCD
     *	2. 啟動 nebula/redis-twemproxy
     *		所需參數
     *			Local Public IP (eth0 public IP)
     *			twemproxy port/statPort
     *			ResInfo.ResId
     */

    var getPublicIp = function() {
        var ni = require('os').networkInterfaces();
        var eth0Ipv4 = _.filter(ni['eth0'], function(data) {
            return data.family == 'IPv4'
        });
    
        return (eth0Ipv4.length > 0) ? eth0Ipv4[0].address : null;
    };

    async.waterfall([
            function(cb) {
                // create container
    
                var optsc = {
                    'Hostname': '',
                    'User': '',
                    'AttachStdin': false,
                    'AttachStdout': true,
                    'AttachStderr': true,
                    'Tty': true,
                    'OpenStdin': false,
                    'StdinOnce': false,
                    'Env': [
                        "PROCESS_ID=" + resId,
                        "ETCD_HOST=" + getPublicIp() + ":4001"
                    ],
                    'Cmd': [],
                    'Image': "nebula/redis-twemproxy",
                    'Volumes': {},
                    'VolumesFrom': ''
                };
                logger.debug('create container option: ', optsc);
    
                docker.createContainer(optsc, cb);
            },
            function(container, cb) {
                // start docker container
                var startOptions = {
                    "PortBindings": {
                        "6000/tcp": [{
                            "HostPort": "" + port
                        }],
                        "6222/tcp": [{
                            "HostPort": "" + statPort
                        }]
                    }
                };
                logger.debug('start contianer options: ', startOptions);
    
                container.start(startOptions, function(err, data) {
    
                    if (err != null) {
                        logger.error('start container error!!!', err);
    
                        var result = {
                            code: -1,
                            out: '',
                            err: err,
                            cli: '',
                            args: []
                        };
                        containerApi.updateProxyStatus(resId, procId, result);
                    }
    
                    cb(err, container);
                });
            },
            function(container, cb) {
                console.log('container started! ', container.id);
                // 最後一步，回報狀態
                containerApi.updateProxyStatus(resId, procId, {
                    code: 0
                });
    
                cb(null);
            }
        ],
        function(err, result) {
            logger.info('start a new twemproxy over.....');
        });
};
