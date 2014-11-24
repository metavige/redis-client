/**
    Redis Adapter, for redis process creation, test

    author: ricky.chiang@quantatw.com
    date: 2014/11/12

 */

var exec = require('child_process').exec,
    util = require('util'),
    _ = require("underscore");

var containerApi = require('./container');
var redisInfo = require('redis-info');

// Define bash command
var commands = {
    create: 'redis-server --port %d --maxmemory %dmb --requirepass %s --daemonize yes',
    info: 'redis-cli -p %d -a %s info',
    pid: 'ps -A -f | grep redis-server |  grep "*:%d" | awk \'{print $2}\''
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

    console.log('show create options: ', options);

    var command = util.format(commands.create,
        options.port, options.mem, options.pwd);
    console.log('prepare create command: ', command);

    // TODO: Check instance is running???


    exec(command, function(error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);

        if (error !== null) {
            console.log('exec error: ' + error);
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
 * 取得 Redis Instance Info
 * @return {[type]} [description]
 */
redisAdapter.infoUpdate = function(redisConfig) {

    var command = util.format(commands.info, redisConfig.port, redisConfig.pwd);
    console.log('get redis info: ', command);

    exec(command, function(error, stdout, stderr) {

        var updatedStatus = {
            pid: redisConfig.id
        };

        //console.log(stdout);
        if (error !== null) {
            console.log('info exeute error', error, stderr);
            // errorBack.call(null);
            updatedStatus.error = error;

            // TODO: Error Call
            containerApi.sendRedisInfo(updatedStatus);
        } else {
            var redisInfo = redisInfo.parse(stdout);
            updatedStatus._info = redisInfo;

            containerApi.sendRedisInfo(updatedStatus);
        }
        // callback(error === null);
    });
};
