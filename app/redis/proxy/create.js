/**
 * Proxy 建立
 *
 * 建立一個新的 TwemProxy
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    async = require('async'),
    _ = require("underscore"),
    Docker = require('dockerode');

(function() {
    var docker = new Docker({
        socketPath: '/var/run/docker.sock'
    });


    function getPublicIp() {
        var ni = require('os').networkInterfaces();
        var eth0Ipv4 = _.filter(ni['eth0'], function(data) {
            return data.family == 'IPv4'
        });

        return (eth0Ipv4.length > 0) ? eth0Ipv4[0].address : null;
    }

    function ProxyCreateCommand(manager) {
        this.manager = manager;
    }

    ProxyCreateCommand.prototype.updateStatus = function() {

        this.manager.callContainerApi('proxy.statusUpdate', resId, procId, result);
    };

    ProxyCreateCommand.prototype.handle = function(resId, procId, port, statPort) {

        var logger = this.manager.logger,
            _self = this;
        /**
         *  1. 設定 twemproxy 的 port 給 ETCD
         *	2. 啟動 nebula/redis-twemproxy
         *		所需參數
         *			Local Public IP (eth0 public IP)
         *			twemproxy port/statPort
         *			ResInfo.ResId
         */
        // 建立 Docker Container 的設定
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
        logger.debug('make proxy docker options:', optsc);

        // 啟動 Docker container 的設定
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
        logger.debug('start proxy docker options:', optsc);

        async.waterfall([
                function(cb) {
                    // create container
                    logger.debug('create container option: ', optsc);
                    docker.createContainer(optsc, cb);
                },
                function(container, cb) {
                    // start docker container
                    logger.debug('start contianer options: ', startOptions);
                    container.start(startOptions, cb);
                }
            ],
            function(err, result) {
                logger.info('after start a new twemproxy.....');

                if (err != null) {
                    logger.error('start container error!!!', err);

                    result = {
                        code: -1,
                        out: '',
                        err: err,
                        cli: '',
                        args: []
                    };
                    // 做個錯誤記錄
                    _self.manager.emit('error', 'redis proxy create', err, result);
                    // containerApi.updateProxyStatus(resId, procId,
                    //     result);
                }

                logger.debug('start container result: ', result);
                _self.updateStatus(resId, procId, result);
            });

    }

    module.exports = ProxyCreateCommand;
})();
