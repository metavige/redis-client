// var redis = require('redis');
var express = require('express'),
    util = require('util'),
    exec = require('child_process').exec,
    redisClient = require('redis'),
    router = express.Router();

// var redisProcessor = require('../lib/redis');

/* define redis api */
router.route('/')
    .post(function(req, res, next) {
        /**
            Post Body = {
                id: 'resourceId',
                port: 'redis port',
                pwd: 'auth password',
                mem: 'allocate memory size'
            }
         */

        /**
            1. get redis create process param from body
            2. make redis start process command
            3. usr child_process.exec to execute command (async)
            4. return command execute status, ok or fail
         */
        console.log(req.body);

        var command = util.format('redis-server --port %s &', req.body.port);
        exec(command, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log('exec error: ' + error);
            }

            res.send((error !== null) ? 'failed' : 'ok');
        });

        // res.send('respond post with a resource');
        // next();
    });

module.exports = router;
