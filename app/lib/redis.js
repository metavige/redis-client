/**
    Redis Adapter, for redis process creation, test

    author: ricky.chiang@quantatw.com
    date: 2014/11/12

 */

var path = require('path'),
    exec = require('child_process').exec,
    util = require('util'),
    _ = require("underscore"),
    redisInfo = require('redis-info');

var containerApi = require(path.join(__dirname, './container'));
var logger = require(path.join(__dirname, './logger'));

// Define bash command
var commands = {
    redis: {
        create: 'redis-server --port %d --maxmemory %dmb --requirepass %s --daemonize yes',
        info: 'redis-cli -p %d -a %s info',
        pid: 'ps -A -f | grep redis-server |  grep "*:%d" | awk \'{print $2}\'',
    },
    sentinel: {
        start: path.join(__dirname, 'bin/start-sentinel') + ' %s'
    },
    proxy: {
        start: path.join(__dirname, 'bin/start-twemproxy') + ' %s %s %s'
    }
};

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
redisAdapter.create = function(options) {
    options = options || {};

    logger.debug('show create options: ', options);

    var command = util.format(commands.redis.create,
        options.port, options.mem, options.pwd);
    logger.debug('prepare create command: ', command);

    // TODO: Check instance is running???
    exec(command, function(error, stdout, stderr) {
        logger.debug('stdout: ' + stdout);
        logger.debug('stderr: ' + stderr);

        if (error !== null) {
            logger.error('exec error: ' + error);
            // error.call(null, error);
            //
            // TODO: 錯誤處理！？
        } else {
            // TODO: 之後準備建立完畢之後，呼叫 containerApi 更新狀態

            // if redis instance create success
            redisAdapter.infoUpdate(options);
        }
    });

};

/**
 * 更新 Redis Instance Info
 * @param {Boolean} redisConfig [description]
 */
redisAdapter.infoUpdate = function(redisConfig) {

    var command = util.format(commands.redis.info, redisConfig.port, redisConfig.pwd);
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
