/**
 * Sentinel Listener
 *
 * listen sentinel event, send message to container API
 *
 * author: ricky.chiang@quantatw.com
 * date: 2014/12/25
 */

var path = require('path'),
    Sentinel = require('node-sentinel'),
    logger = require(path.join(__dirname, './logger')),
    config = require(path.join(__dirname, 'lib/config'));

var sentinelMonitor = module.exports = {
    instance: null
};

if (config.isProxy()) {

    var containerApi = require(path.join(__dirname, './container'));
    var sentinel = new Sentinel('127.0.0.1', '6380');

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

        containerApi.switchMaster(event.details);
    });

    sentinelMonitor.instance = sentinel;
}
