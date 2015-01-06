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
  DockerUtils = require('./dockerUtils'),
  RedisSentinel = require('redis-sentinel-client'),
  async = require('async');

(function () {

  // 設定 Sentinel 相關的資料參數
  var defaults = {
    // other options for manager
    debug: false,
    interval: 30 * 1000, // 30s, refresh master info
    restartTimeout: 3 * 1000,
    maxRetryTimes: 5,
    // host, port
    host: '127.0.0.1', // default is localhost
    port: 6380, // default for NEBULA Sentinel Server is 6380
    // Sentinel Master Options -> { ip, port, quorum }
    master_debug: false,
    // Docker Options
    containerId: 'sentinel'
  };

  var sentinelMonitorConfig = {
    'down-after-milliseconds': 5000,
    'failover-timeout': 5000,
    'parallel-syncs': 1,
    'client-reconfig-script': '/usr/local/bin/reconfigure'
  };

  /**
   * 建構子
   *
   * @param {[type]} sentinelOptions [description]
   */
  function SentinelManager(sentinelOptions) {

    // if (arguments.length < 2) {
    //   adapter = sentinelOptions;
    //   sentinelOptions = {};
    // }
    // =======================================================
    // Fields
    // =======================================================
    var _self = this,
      logger = commons.logger,
      _isMonitored = false,
      _monitorIds = [];

    // logger.debug('Redis Manager: ', arguments);
    /*
		   host + port | sentinels [[host1,port1],[host2,port2]]
		   masterName
		   masterOptions : 參考 https://github.com/mranney/node_redis#rediscreateclientport-host-options
		   master_auth_pass
		   master_debug
		 */
    commons.setDefaultOptions(sentinelOptions, defaults);
    var _sentinelOptions = sentinelOptions;
    if (commons._.isUndefined(_sentinelOptions.dockerUtils)) {
      _sentinelOptions.dockerUtils = new DockerUtils({
        host: 'http://' + sentinelOptions.host,
        port: 4243 // TODO: 應該把這種常數，放到固定的地方來存取
      });
    }

    // logger.debug('sentinelOptions', _sentinelOptions);
    // logger.debug('dockerUtils', _sentinelOptions.dockerUtils);

    // 即時的 Master 資訊，用來監控 REDIS Master
    this.master = {
      interval: _sentinelOptions.interval,
      info: {}
    };

    // =======================================================
    // Events
    // =======================================================
    /**
     * 事件: 啟動 Container (順序: 01)
     *
     * 當 Docker Container 未啟動，就需要觸發這個事件
     *
     */
    this.on('startContainer', function (container) {
      container.start(function (err) {
        if (err) {
          logger.error('[startContainer] 啟動 sentinel container 發生錯誤!', err);
          // TODO: 如果啟動 container 發生錯誤，要通知 ContainerApi
          return;
        }

        // 如果 container 確認已經啟動，就觸發事件
        logger.debug('[startContainer] container 已經啟動');
        _self.emit('containerReady');
      });
    });

    /**
     * 事件: sentinel container 已經準備好 (順序: 02)
     *
     * 如果已經啟動 container, 表示 sentinel 已經建立好
     * 只需要做 sentinel monitor 就可以
     */
    this.on('containerReady', function () {
      logger.debug('[containerReady] 準備建立 Sentinel Client 來處理 Sentinel 資料');
      this._createSentinelClient();
    });

    /**
     * 事件: 啟動 Sentinel Monitor (順序: 03)
     *
     * 當 docker container 沒有問題，就啟動 node-sentinel 來啟動
     */
    this.on('monitoring', function () {
      // var so = _sentinelOptions;
      logger.debug('[monitoring] 準備設定更新 sentinel 狀態資料');
      this._prepareUpdateInfo();
    });

    /**
     * 事件: 當發現無法抓到 Master 資料，需要設定 sentinel
     *
     * 這個事件會在第一次進入到 Sentinel 準備監控新的 MasterName 的時候
     * 所以這時候要需要手動建立 sentinel monitor 設定
     */
    this.on('initMonitor', _initMonitor.bind(this));

    // =======================================================
    // Public Methods
    // =======================================================
    this.init = function () {
      // 確認 Docker 有啟動？
      this._checkSentinelContainer();
    };

    /**
     * 取得 masterInfo
     */
    this.getMasterInfo = function () {
      return this.master.info;
    };

    /**
     * 關閉 Manager
     * @return {[type]} [description]
     */
    this.close = function () {
      if (this.master.intervalId) {
        clearInterval(this.master.intervalId);
      }
      this.removeAllListeners();
      this.sentinelClient = null;
    };
    // =======================================================
    // Private Methods
    // =======================================================

    /**
     * 用來檢查 Sentinel Container 是否有啟動
     * 如果沒有的話要觸發事件來先啟動 Sentinel Container
     */
    this._checkSentinelContainer = function () {
      var so = _sentinelOptions;

      var container = so.dockerUtils.getContainer(so.containerId);
      container.inspect(function (err, data) {
        if (err) {
          logger.error('get container error', err);
          // TODO: 當取得 Container 發生錯誤，表示這個環境沒有安裝 Docker
          // 或 sentinel 這個 container 未建立，要先建立
          return;
        }

        if (data.State.Running) {
          logger.debug('[init] container is ready');
          _self.emit('containerReady');
        } else {
          logger.debug('container stop, need start container');
          _self.emit('startContainer', container);
        }
      });
    };

    /**
     * 建立 Sentinel Client，用來監聽 Sentinel 狀態變遷
     */
    this._createSentinelClient = function () {
      logger.debug('[containerReady] 準備建立一個新的 sentinel client');
      // 設定一個 Sentinel Monitor 的 Client 監聽 Sentinel
      var sc = _self.sentinelClient = RedisSentinel.createClient(_sentinelOptions);
      // logger.debug('建立一個 Sentinel Client', _self.client);
      // 如果設定的 MasterName 已經存在，可以觸發 sentinel connected 事件
      sc.once('sentinel connected', function (hostAndPort) {
        logger.info('[containerReady] sentinel 連線成功！', hostAndPort);

        // 如果連線成功，就設定 sentinel client 的事件，監聽 sentinel
        // 主要是 switch master 事件
        addSentinelEvents(this);
        _self._prepareUpdateInfo();
      });
    };

    /**
     * 更新 Sentinel Master 的資料
     * @param {[type]} err     [description]
     * @param {[type]} data    [description]
     */
    this._updateMaster = function (err, data) {
      if (err) {
        logger.error('updateMaster:' + err);

        // 當發生錯誤，檢查是不是沒有辦法抓到 masterName
        var errStr = err.toString();
        if (errStr.indexOf('ERR No such master with that name') > 0) {
          // 觸發事件，準備初始化 Sentinel Monitoring
          _self.emit('initMonitor');
        } else {
          // TODO: 如果是其他錯誤，就直接觸發 error 事件後續處理（但是要有人處理）
          _self.emit('error', err);
        }
        return;
      }

      if (!_isMonitored) {
        _isMonitored = true;
        // 要到有真的抓到 Master Info 才算 SentinelManager 啟動成功
        logger.debug('emit monitoring event');
        _self.emit('monitoring');
      }

      var info = this.master.info = ParseSentinelMasterInfo(data);
      logger.debug('更新 MasterInfo:', info);

      this.emit('masterInfo', info); // 觸發事件，之後可以做 sentinel 監控
    };

    /**
     * 設定呼叫 sentinel 的 master 指令，用來更新 master info
     */
    this._prepareUpdateInfo = function () {
      // 因為已經啟動，所以設定一個定時做回報的 interval
      function getMasterInfo() {
        _self.sentinelClient.sentinel(['master', _sentinelOptions.masterName],
          _self._updateMaster.bind(_self));
      }
      getMasterInfo();
      if (this.master.intervalId) clearInterval(this.master.intervalId); // clear if exist
      this.master.intervalId = setInterval(getMasterInfo, this.master.interval);
    };

    /**
     * sentinel monitor 初始化
     */
    function _initMonitor() {
      logger.debug('[initMonitor] 準備設定 sentinel monitor....')
      var monitorArgs = [],
        mo = _sentinelOptions.masterOptions,
        mn = _sentinelOptions.masterName,
        client = _self.sentinelClient;
      // 先組合出所有的設定屬性
      monitorArgs.push(['monitor', mn, mo.ip, mo.port, mo.quorum]);
      monitorArgs.push(['set', mn, 'auth-pass', _sentinelOptions.master_auth_pass]);
      commons._.map(sentinelMonitorConfig, function (v, k) {
        monitorArgs.push(['set', mn, k, v]);
      });
      logger.debug('monitorArgs:', monitorArgs);
      // 把陣列參數轉換成一個由 function 組成的 array
      // 要提供給 async 順序執行
      var monitorFuncs = commons._.map(monitorArgs, function (args) {
        return function (cb) {
          logger.debug('exec sentinel args:', args);
          client.sentinel(args, cb);
        };
      });

      // 透過 async.series 順序執行所有的 function
      async.series(monitorFuncs, function (err, result) {
        if (err) {
          // 理論上應該不能有錯誤發生～
          _self.emit('error', err);
          return;
        }

        logger.debug('init monitor result:', result);
        _self._prepareUpdateInfo(); // 重新設定更新 MasterInfo
      });
    };

    /**
     * 根據 node-sentinel 所提供的事件，監聽之後轉發給 _self
     *
     * @param {[type]} sentinelClient [description]
     */
    function addSentinelEvents(client) {
      logger.debug('[containerReady] 設定 sentinel client 的事件');
      // 接聽 master 變更的事件，這是主要用來通知 ContainerApi 的事件
      //
      // 20150106 rickychiang 透過 SentinelClient
      // 會有 failover start, failover end 事件，這兩個事件是用來檢查並記錄確認 Master 的變更已經完成
      // 之後就會觸發 switch master 事件，用 master.info 的資料來更新
      //
      // return { 'master-name', 'new-ip', 'new-port' }
      // 參考的是 node-sentinel 的 switch master
      client.on('switch master', function () {
        var info = _self.master.info;
        logger.debug('switch master:', info);
        // 觸發事件
        _self.emit('switchMaster', {
          'master-name': info.name,
          'new-ip': info.ip,
          'new-port': info.port
        });
      });

      // 設定 error 事件
      client.on('error', function (err) {
        // logger.error('sentinel client 發生錯誤', err);
        // TODO: 直接觸發 error 事件後續處理（但是要有人處理）
        _self.emit('error', err);
      });
    }

  }

  /**
   * 用來解析 sentinel master 命令的結果，把資料由陣列轉成物件格式
   * 方便使用
   *
   * @param {Array} data sentinel master 的結果
   */
  function ParseSentinelMasterInfo(data) {
    var md = {};
    data.map(function (v, index, allData) {
      // console.log(v, index, allData);
      if (index % 2 == 1) {
        this[allData[index - 1]] = v;
      }
    }, md);

    /*
		master info 範例
		{ name: 'mymaster',
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
  		quorum: '2'
    }
		*/

    return md;
  }

  commons.extendEventEmitter(SentinelManager);

  module.exports = SentinelManager;
})();