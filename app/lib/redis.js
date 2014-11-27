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
 * @param {[type]}   command  [description]
 * @param {[type]}   args     [description]
 * @param {Function} callback [description]
 */
function spawnCommand(command, args, callback) {
    var child = spawn(command, args);

    var result = {
        out: null,
        err: null
    };

    child.stdout.on('data', function(data) {
        result.out = data;
    });

    child.stderr.on('data', function(data) {
        logger.error(data);
        result.err = data;
    });

    child.on('close', function(code) {
        logger.info('child process exited with code ' + code);

        callback(code, result);
    });
}

function redisCli(callback, port, auth, params) {
    var redisCliParams = _.map(params, _.clone);
    _.each(['-p', port, '-a', auth], redisCliParams.push);

    logger.debug('redis-cli params:', redisCliParams);

    spawnCommand('redis-cli', redisCliParams, callback);
}

function sentinelCli = function(callback, params) {
    var sentinelParams = _.map(params, _.clone);
    sentinelParams.unshift('sentinel');
    logger.debug('sentinel params:', sentinelParams);

    redisCli(callback,
        config.sentinel.port,
        config.sentinel.auth,
        sentinelParams);
}

// var redis = require('redis');

var redisAdapter = module.exports = {};

/**
 * 建立一個新的 Redis Instance
 * [create description]
 * @param  {Number}   port     Redis PortNUmber
 * @param  {Number}   memory   Redis MemorySize
 * @param  {String}   pwd      Password
 * @return {[type]}            [description]
 */
redisAdapter.newRedis = function(options) {

    // command: redis-server --port 123 --maxmemory 128mb --requirepass 123 --daemonize yes

    var cmdArgs = ['--port', options.port,
        '--maxmemory', options.mem + 'mb',
        '--requirepass', options.pwd,
        '--daemonize', 'yes'
    ];

    spawnCommand('redis-server', cmdArgs, function(code, result) {
        if (code === 0) {
            logger.info('create redis server success !!!');
        }
    });
};

/**
 * initial sentinel monitor
 * @param {[type]} monitorName  Sentinel Monitor Name (Maybe ResId)
 * @param {[type]} masterHost   [description]
 * @param {[type]} masterPort   [description]
 * @param {[type]} auth         [description]
 * @param {[type]} quorum       [description]
 */
redisAdapter.sentinelMonitor = function(monitorName,
    masterHost, masterPort,
    auth, quorum) {

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
            sentinelCli(callback, ['set', 'auth-pass', auth]);
        },
        function(callback) {
            // Config .....
            var configs = [];
            _.each(allConfigOptions, function(v, k) {
                sentinelCli(callback, ['set', k, v]);
            });

            async.series(configs);
        }
    ]);
}


/**
 * TODO: 目前發現好像有問題，所以看看是否不需要這個
 *
 * 更新 Redis Instance Info
 * @param {Boolean} redisConfig [description]
 */
redisAdapter.infoUpdate = function(redisConfig) {

    var command = util.format(commands.redis.info, redisConfig.port,
        redisConfig.pwd);
    logger.debug('get redis info: ', command);

    exec(command, function(error, stdout, stderr) {

        var updatedStatus = {
            id: redisConfig.id
        };

        //logger.debug(stdout);
        if (error !== null) {
            logger.error('info exeute error', error, stderr);
            // errorBack.call(null);
            updatedStatus.error = error;

            // TODO: Error Call
            containerApi.sendRedisInfo(updatedStatus);
        } else {
            var redisInfoData = redisInfo.parse(stdout);
            updatedStatus.info = redisInfoData;

            containerApi.sendRedisInfo(updatedStatus);
        }
        // callback(error === null);
    });
};

//
// Grap Sentinel Port
// docker inspect --format '{{(index (index .NetworkSettings.Ports "26379/tcp") 0).HostPort }}' $(docker ps | grep sentinel | awk '{print $1}')
//
// if (config.container.type !== 'redis') {
//     spawnCommand('sh', [path.join(_dirname, 'bin/grap-sentinel-port')],
//         function(
//             code, result) {
//             if (code == 0 && !_.isNaN(result)) {
//                 config.sentinel = {
//                     port: new Number(port)
//                 };
//             }
//         });
// }
