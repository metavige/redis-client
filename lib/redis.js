/**
    Redis Adapter, for redis process creation, test

    author: ricky.chiang@quantatw.com
    date: 2014/11/12

 */

var _ = require('underscore'),
    exec = require('child_process').exec,
    util = require('util');

var redis = require('redis');

//var redisAdapter = module.exports = {};

/* Defin Redis */
function RedisAdapter(config) {

    this.config = _.extend({
        api: {
            host: 'http://127.0.0.1',
            port: 80
        }
    }, config || {});

    // console.log(this.config);
}

RedisAdapter.prototype.makeCommand = function (arg) {
    return util.format('redis-server --port %s --maxmemory %dmb &', arg.port,
        arg.memory);
};

RedisAdapter.prototype.create = function (options) {

    var command = RedisAdapter.makeCommand(options);

    // 實際執行，取得回應
    exec(command, function (err, stdout, stderr) {

    });
};


RedisAdapter.prototype.check = function (redisConfig, callback) {

    //    var client = redis.createClient(redisConfig.port, redisConfig.host, {});
    //
    ////    client.on('all', console.log);
    //
    //    client.on('ready', function() { callback.apply(null, true) });
    //    client.on('error', function() { callback.apply(null, false); });

    var command = util.format('redis-cli -p %d info', redisConfig.port);
    console.log(command);

    exec(command, function (error, stdout, stderr) {
        //console.log(stdout);
        if (error !== null) {
            console.log('command exeute error', error, stderr);
        }

        callback(error === null);
    });
};


module.exports = RedisAdapter;
