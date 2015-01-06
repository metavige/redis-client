/**
 * Redis Instance
 *
 * Redis 的管理
 *
 * Created by rickychiang on 14/12/31.
 */

// =======================================================
// Module dependencies
// =======================================================
var commons = require('../base/commons'),
  redis = require('redis'),
  spawn = require('child_process').spawn;

(function () {

  // default redis options
  var defaults = {
    debug: false,
    interval: 10 * 1000,
    restartTimeout: 3 * 1000,
    maxRetryTimes: 5,
    getConf: function (options) {
      return ['--port', options.port,
        '--maxmemory', options.mem + 'mb',
        '--requirepass', options.pwd,
        '--daemonize', 'yes',
        '--pidfile', '/var/run/redis/redis-server-' + options.id + '.pid',
        '--logfile', '/var/log/redis/redis-' + options.id + '.log',
        '--dir', '/var/lib/redis',
        '--dbfilename', options.id + '.rdb'
      ];
    }
  };

  var logger = commons.logger;

  // =======================================================
  // Private Methods
  // =======================================================
  function spawnCommand(command, args, callback) {
    var child = spawn(command, args);
    // logger.debug('spawn arguments:', args);

    var result = {
      out: null,
      err: null,
      cli: command,
      args: args
    };

    child.stdout.on('data', function (data) {
      result.out = '' + data;
      // logger.debug('execute process result: ', result.out);
    });

    child.stderr.on('data', function (data) {
      result.err = '' + data;
      logger.error('child process error: ', result.err);
    });

    child.on('close', function (code) {
      result.code = code;
      logger.info('執行 CLI 命令 :', result);

      // 改變 callback 的回傳資料，改成跟 async 類似的方式
      // 為了統一所有的 callback 傳遞
      var err = (code == 0) ? null : result.err;
      callback(err, result);
    });
  }

  // =======================================================
  // Constructor
  // =======================================================
  function RedisManager(managerOptions) {

    // 設定初始值
    managerOptions || (managerOptions = {});
    Object.keys(defaults).forEach(function (def) {
      if (!managerOptions[def]) managerOptions[def] = defaults[def]
    });
    // logger.debug('managerOptions:', managerOptions);

    var _options = {},
      _started = false,
      _self = this,
      _retryTimes = 0;

    // 即時的 Redis 資訊，用來監控 REDIS (rti = Realtime Info)
    this.rti = {
      interval: managerOptions.interval,
      info: {}
    };

    // =======================================================
    // Events
    // =======================================================
    /**
     * init 事件
     *
     * 建立一個新的 Redis，觸發後會建立一個新的 REDIS Instance
     *
     * @param  options redis 啟動參數
     */
    this.on('init', function (options) {
      // get service option (cli)
      var redisServerOptions = managerOptions.getConf(options);

      logger.debug('RedisServerOptions', redisServerOptions);
      // create redis, call spawnCommand
      spawnCommand('redis-server',
        redisServerOptions,
        redisServerCreateCallback);
    });

    /**
     * ready 事件
     *
     * 當 redis client 確定已經連上，就開始做定時檢查 info 的動作
     *
     */
    this.on('ready', function () {
      // 如果已經連上，就做一個定時檢查 redis 的動作
      function getInfo() {
        _self.client.info(_self._updateInfo.bind(_self));
      }
      getInfo();
      _self.rti.intervalId = setInterval(getInfo, _self.rti.interval);
    });

    /**
     * error 事件
     *
     * 如果發生無法連線的錯誤，要根據之前存起來的資料，重新啟動
     * 其他錯誤，先做記錄
     *
     * @param  {Object} err 錯誤訊息
     */
    this.on('error', function (err) {
      var errStr = err.toString();
      // TODO: 做錯誤記錄！
      logger.error('[REDIS]', '[' + _options.id + ']', errStr);

      // 看是不是沒連線，如果是，重新啟動
      if (!_started && errStr.indexOf('connect ECONNREFUSED') > 0) {
        _self.emit('init', _options);
      }
    });

    // =======================================================
    // Public Methods
    // =======================================================

    /**
     * 初始化
     * @param  {[type]} options [description]
     * @return {[type]}         [description]
     */
    this.init = function (options) {
      _options = commons._.extend(_options, options || {});
      logger.debug('init options', _options);

      // 如果有連線上，就直接做 monitor 就好
      // 如果沒有連線上 redis, 就先啟動 Redis 再去監聽
      this.connect(_options);
    };

    /**
     * 建立一個 redis client 用來監控 redis.
     *
     * @param  {Object} options 連線 Redis 參數
     */
    this.connect = function (options) {
      // create a redis client, to monitor redis
      var client = _self.client = createRedisClient(options);

      client.on('error', function (err) {
        // logger.error('redis error: ', err);
        _started = client.connected;
        // 如果有發生錯誤，要做通知
        _self.emit('error', err);
      });

      // 當已經連上，設定啟動狀態
      client.on('ready', function () {
        logger.info('[REDIS][Port:' + _options.port + '] 建立成功!');
        _started = client.connected;
        _self.emit('ready');
      });

      // setTimeout(function() {
      //     if (!_started) {
      //         logger.debug('等待過久，沒發現 REDIS，啟動新的 instance');
      //         _self.emit('init', _options);
      //     }
      // }, 1000);
    };

    /**
     * 關閉 Redis Manager
     *
     */
    this.close = function () {
      _self.removeAllListeners(); // 移除所有監聽的事件

      if (_self.rti.intervalId) {
        // 停止定時 info
        clearInterval(_self.rti.intervalId);
      }
      _self.client.end(); // 關閉 redis client
      _self.client = null;
      _started = false;
    };

    /**
     * 關閉 Redis Instance
     * @return {[type]} [description]
     */
    this.destroy = function () {
      // TODO:
    };

    this.isStarted = function () {
      return _started;
    }

    // =======================================================
    // Private methods.
    // =======================================================
    /**
     * 更新 REDIS Info
     *
     * @param {[type]} err     [description]
     * @param {[type]} infoStr [description]
     */
    this._updateInfo = function (err, infoStr) {
      if (err) return logger.error(err);

      var info = parseInfo(infoStr),
        changes = parseChanges(this.rti.info, info);

      this.rti.info = info;

      if (!this.rti.initialized) {
        if (commons.listenerCount(this, 'rti') > 0) {
          this.emit('rti', this.rti);
        }
        this.rti.initialized = true;
        this.rti.lastUpdate = Date.now();
        this.rti.updates++;
      }

      if (changes && Object.keys(changes).length) {
        if (commons.listenerCount(this, 'rti') > 0) {
          this.emit('rti', this.rti); // 觸發 rti 事件，如果有人需要全部的資料
        }
        if (commons.listenerCount(this, 'update') > 0) {
          this.emit('update', changes); // 觸發 update 事件，如果有人只需要更新資料
        }
        this.rti.lastUpdate = Date.now();
        this.rti.updates++;
      }
    };

    /**
     * 建立一個新的 Redis Client
     * @param {[type]} options [description]
     */
    function createRedisClient(options) {

      var redisOptions = {
        'retry_max_delay': 30 * 1000,
        'connect_timeout': 500
      };
      if (options.pwd) {
        redisOptions.auth_pass = options.pwd;
      }
      logger.debug('options for connect redis:', options.port, redisOptions);

      // 目前預設都是管理本機的 Redis, 所以 host 目前固定為 127.0.0.1
      return redis.createClient(options.port, '127.0.0.1', redisOptions);
    }

    /**
     * 建立 Redis Server 的 Callback function
     *
     * spawnCommand 的 callback 參數
     *
     * @param {[type]} err    [description]
     * @param {[type]} result [description]
     */
    function redisServerCreateCallback(err, result) {
      if (err != null) {
        // 如果發生錯誤，要做一些處理～
        logger.error('建立 redis 發生問題！', err, result);

        // if (_retryTimes > managerOptions.maxRetryTimes) {
        //     // TODO: 超過最大重試次數，呼叫 ContainerApi 做錯誤通知！
        //     return;
        // }

        // 嘗試重新啟動
        _self.retryId = setTimeout(function () {
          logger.info('重新嘗試啟動 Redis ..... [' + (_retryTimes++) + ']',
            _options);
          _self.emit('init', _options);
        }, managerOptions.restartTimeout);
      } else {
        // 如果建立成功的話，觸發一個事件用來通知
        _self.emit('created');
      }
    }

  }

  // 讓 Redis Manager 支援 Event Emitter
  commons.extendEventEmitter(RedisManager);

  // =======================================================
  // RTI methods.
  // =======================================================

  /**
   * Parse Changes.
   *
   * @param oldInfo
   * @param newInfo
   * @return {Object}
   */
  function parseChanges(oldInfo, newInfo) {
    return Object.keys(newInfo).reduce(function (acc, x) {
      if (!oldInfo[x] || oldInfo[x] !== newInfo[x]) {
        acc[x] = newInfo[x];
      }
      return acc;
    }, {});
  }

  /**
   * Parse node_redis INFO output string.
   *
   * @param info
   * @return {Object}
   */
  function parseInfo(info) {
    // logger.debug('Prepare ParseInfo:', info.toString());
    return info.toString().split('\r\n').reduce(function (acc, x) {
      var kv = x.split(':');
      if (kv[1]) {
        acc[kv[0]] = kv[1];
      }
      return acc;
    }, {});
  }

  module.exports = RedisManager;
})();