/**
 * sentinel 設定
 *
 * 設定 sentinel 監聽
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    async = require('async'),
    _ = require("underscore");

(function() {

    function SentinelMonitorCommand(manager) {
        this.manager = manager;
        this.sentinelCli = function() {
            manager.sentinelCli.call(manager, arguments);
        }; // delegate sentinelCli function
    }

    SentinelMonitorCommand.prototype.handle = function(resId, procId, sentinelData) {

        var _self = this,
            logger = this.manager.logger;

        // sentinelData.name,
        // sentinelData.ip,
        // sentinelData.port,
        // sentinelData.pwd,
        // sentinelData.quorum
        // sentinelData.procId

        // command: redis-cli -p [sentinelPort] sentinel monitor [monitorName] [masterHost] [masterPort] [quorum]
        // command: redis-cli -p [sentinelPort] sentinel set [monitorName] [configOption] [configValue]

        // 以下為要設定 sentinel 的 options
        var allConfigOptions = {
            'down-after-milliseconds': 5000,
            'failover-timeout': 5000,
            'parallel-syncs': 1,
            'client-reconfig-script': '/usr/local/bin/reconfigure'
        };

        async.series([
            function(callback) {
                // setup Monitor first
                _self.sentinelCli(callback, ['monitor',
                    sentinelData.name,
                    sentinelData.ip,
                    sentinelData.port,
                    sentinelData.quorum
                ]);
            },
            function(callback) {
                // SET MASTER AUTH
                _self.sentinelCli(callback, ['set', sentinelData.name,
                    'auth-pass',
                    sentinelData.pwd
                ]);
            },
            function(callback) {
                // Config .....
                var configs = [];
                _.each(allConfigOptions, function(v, k) {
                    _self.sentinelCli(callback, ['set',
                        sentinelData.name, k, v
                    ]);
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
                // containerApi.updateSentinelStatus(resId, procId, result);
                _self.manager.callContainerApi('sentinel.updateStatus',
                    resId, procId, result);

                callback(null, result);
            }
        ]);
    }

    module.exports = SentinelMonitorCommand;
})();
