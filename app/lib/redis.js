/**
    Redis Adapter, for redis process creation, test

    author: ricky.chiang@quantatw.com
    date: 2014/11/12

 */

var exec = require('child_process').exec,
    util = require('util'),
    _ = require("underscore");

var containerApi = require('./nebula');
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
        //console.log(stdout);
        if (error !== null) {
            console.log('info exeute error', error, stderr);
            errorBack.call(null);
        } else {
            var infoData = {
                id: redisConfig.id
            };

            if (stdout.toString().indexOf('Connection refused') < 0) {
                // 抓到了 Redis info 的資料
                infoData = _.extend(infoData, redisInfo.parse(
                    stdout));
                // TODO: Add pid?
            }

            containerApi.sendRedisInfo(infoData);
        }
        // callback(error === null);
    });
};


//
//
// /* Defin Redis */
// function RedisAdapter(config) {
//
//     this.config = _.extend({
//         api: {
//             host: 'http://127.0.0.1',
//             port: 80
//         }
//     }, config || {});
//
//     // console.log(this.config);
// }
//
// RedisAdapter.prototype.makeCommand = function(arg) {
//     return util.format('redis-server --port %s --maxmemory %dmb &', arg.port,
//         arg.memory);
// };
//
// RedisAdapter.prototype.create = function(options) {
//
//     var command = RedisAdapter.makeCommand(options);
//
//     // 實際執行，取得回應
//     exec(command, function(err, stdout, stderr) {
//
//     });
// };
//
//
// RedisAdapter.prototype.check = function(redisConfig, callback) {
//
//     //    var client = redis.createClient(redisConfig.port, redisConfig.host, {});
//     //
//     ////    client.on('all', console.log);
//     //
//     //    client.on('ready', function() { callback.apply(null, true) });
//     //    client.on('error', function() { callback.apply(null, false); });
//
//     var command = util.format('redis-cli -p %d info', redisConfig.port);
//     console.log(command);
//
//     exec(command, function(error, stdout, stderr) {
//         //console.log(stdout);
//         if (error !== null) {
//             console.log('command exeute error', error, stderr);
//         }
//
//         callback(error === null);
//     });
// };
//
//
// module.exports = RedisAdapter;
