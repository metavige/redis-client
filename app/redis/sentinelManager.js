/**
 * Sentinel Manager
 *
 * 管理 Sentinel
 *
 * Created by rickychiang on 15/01/05.
 */

// =======================================================
// Module dependencies
// =======================================================
var commons = require('../base/commons'),
    Sentinel = require('node-sentinel'),
    DockerUtils = require('./dockerUtils');

(function() {

    // 設定 Sentinel 相關的資料參數
    var defaults = {
        debug: false,
        host: '127.0.0.1',
        port: 6379,
        interval: 10 * 1000,
        restartTimeout: 3 * 1000,
        maxRetryTimes: 5,
        containerId: 'sentinel',
        dockerUtils: new DockerUtils()
    };

    function SentinelManager(sentinelOptions, adapter) {

        if (arguments.length < 2) {
            adapter = sentinelOptions;
            sentinelOptions = {};
        }
        // =======================================================
        // Fields
        // =======================================================
        var _self = this,
            _isMonitored = false,
            _monitorIds = [],
            _sentinelOptions = commons.setDefaultOptions(sentinelOptions, defaults);

        // 即時的 Master 資訊，用來監控 REDIS Master
        this.masters = {
            interval: _sentinelOptions.interval,
            monitorMasters: []
        };
        // =======================================================
        // Events
        // =======================================================
        this.on('switchMaster', function(options) {
            // 觸發事件，通知 ContainerApi
            adapter.api('sentinel.switchMaster', options);
        });

        this.on('slaveReconf', function(data) {
            logger.debug('[sentinel][slaveReconf]', data);
            // TODO:?
        });
        this.on('failover', function(data) {
            logger.debug('[sentinel][failover]', data);
            // TODO:
        });

        /**
         * 事件: 啟動 Container (順序: 01)
         *
         * 當 Docker Container 未啟動，就需要觸發這個事件
         *
         */
        this.on('startContainer', function(container) {
            container.start(function(err) {
                if (err) {
                    logger.error('start sentinel container error!', err);
                    // TODO: 如果啟動 container 發生錯誤，要通知 ContainerApi
                    return;
                }

                // 如果 container 確認已經啟動，就觸發事件
                _self.emit('containerReady');
            });
        });

        /**
         * 事件: sentinel container 已經準備好 (順序: 02)
         *
         * 如果已經啟動 container, 表示 sentinel 已經建立好
         * 只需要做 sentinel monitor 就可以
         */
        this.on('containerReady', function() {
            var so = _sentinelOptions;

            // 設定一個 Sentinel Monitor 的 Client 監聽 Sentinel
            this.sentinel = new Sentinel(so.host, so.port);

            this.sentinel.ping(function(err, pong) {
                if (err) {
                    logger.error('ping sentinel error:', err);
                    // TODO: 呼叫 ContainerApi 回報 Sentinel Container 內容有問題
                    return;
                }

                // 如果沒有錯誤，就設定 sentinel client 的事件，監聽 sentinel
                addSentinelEvents();
                _isMonitored = true;
                _self.emit('monitoring');
            });
        });

        /**
         * 事件: 啟動 Sentinel Monitor (順序: 03)
         *
         * 當 docker container 沒有問題，就啟動 node-sentinel 來啟動
         */
        this.on('monitoring', function() {
            // var so = _sentinelOptions;

            // 因為已經啟動，所以設定一個定時做回報的 interval
            function getMasterInfos() {
                _self.sentinel.masters(_self._updateMaster.bind(_self));
            }
            getMasterInfos();
            _self.masters.intervalId = setInterval(getMasterInfos, _self.masters.interval);
        });

        // =======================================================
        // Public Methods
        // =======================================================
        this.init = function() {
            // 確認 Docker 有啟動？
            this.checkSentinelContainer();
        };

        /**
         * 加入 Sentinel 監控的資料
         * @param {[type]} monitorOptions [description]
         */
        this.addMonitor = function(monitorOptions) {

        };

        this.getMasters = function() {
            return this.masters.monitorMasters || {};
        };
        /**
         * 關閉 Manager
         * @return {[type]} [description]
         */
        this.close = function() {
            if (_masters.intervalId) {
                clearInterval(_masters.intervalId);
            }
            this.sentinel = null;
        };
        // =======================================================
        // Private Metdhos
        // =======================================================

        /**
         * 用來檢查 SenitorContainer 是否有啟動
         * 如果沒有的話要觸發事件來先啟動 Sentinel Container
         */
        this._checkSentinelContainer = function() {
            var so = _sentinelOptions;

            var container = so.dockerUtils.getContainer(so.containerId);
            container.inspect(function(err, data) {
                if (err) {

                    return;
                }

                if (data.State.Running) _self.emit('containerReady');
                else _self.emit('startContainer', container);
            });
        };

        /**
         * 更新 Sentinel Master 的資料
         * @param {[type]} err     [description]
         * @param {[type]} masters [description]
         */
        this._updateMaster = function(err, masters) {
            if (err) return logger.error('updateMaster', err);

            /* 參考 node-sentinel 的 README
                masters contains
                [ { name: 'mymaster',
                ip: '127.0.0.1',
                port: '6379',
                runid: '',
                flags: 'master',
                'pending-commands': '0',
                'last-ok-ping-reply': '613',
                'last-ping-reply': '613',
                'info-refresh': '9101',
                'num-slaves': '1',
                'num-other-sentinels': '2',
                quorum: '2' },
                ... ]
            */

            this.masters.monitorMasters = masters;
            // logger.debug(masters);

            logger.debug(JSON.stringify(masters));
            this.emit('masters', masters); // 觸發事件，之後可以做 sentinel 監控
        };

        /**
         * 根據 node-sentinel 所提供的事件，監聽之後轉發給 _self
         *
         * @param {[type]} sentinelClient [description]
         */
        function addSentinelEvents() {

            var sentinelClient = _self.sentinel;

            // 接聽 slave 設定的狀態變更
            sentinelClient.on('slave-reconf-status', function(data) {
                //logger.debug('[sentinel][slave-reconf]', data);
                _self.emit('slaveReconf', data);
            })

            // 接聽 failover 狀態變更事件
            sentinelClient.on('failover-status', function(data) {
                //logger.debug('[sentinel][failover]', data);
                _self.emit('failover', data);
            })

            // 接聽 master 變更的事件，這是主要用來通知 ContainerApi 的事件
            sentinelClient.on('switch-master', function(event) {
                logger.debug('switch-master:', event);
                // 觸發事件
                _self.emit('switchMaster', event.details);
            });
        }

    }

    commons.extendEventEmitter2(SentinelManager);

    module.exports = SentinelManager;
})();
