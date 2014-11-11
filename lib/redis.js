

var http = require('http'),
    _ = require('underscore'),
    util = require('util');

var redis = module.exports = {};

/* Defin Redis */
function Redis(config) {    
    this.config = _.extend({
        api: {
            host: 'http://127.0.0.1',
            port: 80
        }
    }, config || {});

    console.log(this.config);
}

Redis.prototype.makeCommand = function(arg) {
    return util.format('redis-server --port %s --maxmemory %dmb &', arg.port,
        arg.memory);
}; 

Redis.prototype.create = function() {
    console.log('create');
};

Redis.prototype.updateStatus = function(isError, stdout, stderr) {
    // Send response to saas api, cause this is async call
    // res.send((error !== null) ? 'failed' : 'ok');
    var options = this.config.api || {
        path: '',
        method: 'POST'
    };
    console.log('options', options);

    var req = http.request(options, function(res) {
        
    });

    // req.write(JSON.stringify({
    //
    // }));

    req.end();
};


module.exports = Redis;
