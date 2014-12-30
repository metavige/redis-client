/**
 * Sentinel Monitor
 *
 * 監視 Sentinel, 用來通知 ContainerApi 有 Master 的變更
 *
 * author: ricky.chiang@quantatw.com
 * date: 2014/12/25
 */

var path = require('path'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter,
    Sentinel = require('node-sentinel');

(function() {

    function SentinelMonitor(agent, options) {

        var logger = agent.logger,
            sentinel = new Sentinel(options.host, options.port);

        sentinel.ping(function(err, pong) {
            if (err != null) {
                logger.error('ping sentinel error:', err);
            }
            logger.debug('PING Sentinel: ', pong);
        });

        // 接聽 slave 設定的狀態變更
        sentinel.on('slave-reconf-status', function(data) {
            logger.debug('[sentinel][slave-reconf]', data);
        })

        // 接聽 failover 狀態變更事件
        sentinel.on('failover-status', function(data) {
            logger.debug('[sentinel][failover]', data);
        })

        // 接聽 master 變更的事件，這是主要用來通知 ContainerApi 的事件
        sentinel.on('switch-master', function(event) {
            logger.debug('switch-master:', event);

            // 觸發事件，通知 ContainerApi 
            agent.emit('container::sentinel.switchMaster', event.details);
        });
    }

    util.inherits(SentinelMonitor, EventEmitter);

    module.exports = SentinelMonitor;
})();
