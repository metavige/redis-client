var testCommon = require('../commons'),
  spawn = require('child_process').spawn,
  async = require('async'),
  expect = testCommon.expect,
  logger = testCommon.logger,
  DockerUtils = testCommon.getTestClass('redis/dockerUtils'),
  SentinelManager = testCommon.getTestClass('redis/sentinelManager');

describe('[測試 Sentinel Manager]', function () {

  var manager = null,
    dockerUtils = new DockerUtils({
      host: 'http://192.168.0.146',
      port: 4243
    }),
    managerOptions = {
      host: '192.168.0.146',
      port: 6380,
      dockerUtils: dockerUtils,
      masterName: 'TEST',
      master_auth_pass: '123',
      masterOptions: {
        ip: '192.168.0.144',
        port: 9999,
        quorum: 1
      }
    };

  describe('[測試 Docker Container 的狀態]', function () {

    it('[測試 sentinel container 還未啟動]', function (done) {
      var fakeDockerUtils = {
        getContainer: function (id) {
          return {
            inspect: function (cb) {
              cb(null, {
                State: {
                  Running: false
                }
              });
            },
            start: function (cb) {
              logger.debug('fake container started!');
              cb(null);
            }
          };
        }
      };
      // manager.removeListener('startContainer');
      var options = {
        'masterName': 'ABC',
        'master_auth_pass': '123',
        'host': '192.168.0.146',
        // docker options
        dockerUtils: fakeDockerUtils
      };
      manager = new SentinelManager(options)

      manager._createSentinelClient = function () {}
      manager._prepareUpdateInfo = function () {}

      manager.once('startContainer', function () {
        // 如果還沒啟動 container, 就要先觸發 startContainer 事件
        done();
      });

      manager.init();
    });

    it('[測試 sentinel container 已經啟動]', function (done) {
      // manager.removeListener('containerReady');
      var fakeDockerUtils = {
        getContainer: function (id) {
          return {
            inspect: function (cb) {
              cb(null, {
                State: {
                  Running: true
                }
              });
            }
          };
        }
      };
      var options = {
        'masterName': 'ABC',
        'master_auth_pass': '123',
        'host': '192.168.0.146',
        // docker options
        dockerUtils: fakeDockerUtils
      };

      manager = new SentinelManager(options);

      // 先移除舊的 containerReady 事件
      manager._createSentinelClient = function () {}
        // manager._prepareUpdateInfo = function () {}

      manager.once('containerReady', function () {
        // 如果已經啟動 container, 就要觸發 containerReady 事件
        done();
      });

      manager.init();
    });
  });

  describe('[測試建立 Sentinel Monitor]', function () {

    afterEach(function () {
      manager.close();

      // 手動移除測試時建立的 Monitor
      removeMonitor();
    });

    it('[第一次檢查 MasterName 不存在，應該要設定 monitor]', function (done) {

      manager = new SentinelManager(managerOptions);

      manager.init();

      // manager.on('error', function (err) {
      //   logger.debug('執行間發生的錯誤', err);
      // });

      var _triggerInitMonitor = false;
      manager.on('initMonitor', function () {
        // 應該要觸發 initMonitor 事件
        _triggerInitMonitor = true;
      });

      manager.on('masterInfo', function (info) {
        logger.info('[masterInfo] 取得 masterInfo', JSON.stringify(info));
        expect(info != null).to.be.ok();

        expect(info.name).to.eql(managerOptions.masterName);
        expect(info.ip).to.eql(managerOptions.masterOptions.ip);
        expect(info.port).to.eql(managerOptions.masterOptions.port);

        expect(_triggerInitMonitor).to.be.ok();
        // logger.info('getMasterInfo! ', info);
        done();
      });

    });
  })

  describe('[測試連線既存的 Sentinel Master]', function () {

    beforeEach(function () {
      addNewMonitor();
      manager = new SentinelManager(managerOptions);
    });

    afterEach(function () {
      manager.close();
      removeMonitor();
    });

    it('[啟動 Manager, 應該不會進入 initMonitor]', function (done) {

      this.timeout(30000);

      manager.init();
      manager.on('initMonitor', function () {
        expect().fail('不應該進入設定 monitor 的事件');
      });

      manager.on('monitoring', function () {
        logger.debug('進入到 monitoring 階段');
      });

      manager.on('masterInfo', function (info) {
        expect(info.name).to.eql(managerOptions.masterName);
        expect(info.ip).to.eql(managerOptions.masterOptions.ip);
        expect(info.port).to.eql(managerOptions.masterOptions.port);
        done();
      });
    });

    // it('[測試事件執行順序: 已經有 monitor 設定的順序]', function () {
    //   var events = [];
    //
    //   // manager.on('initMonitor', function () {
    //   //   events.push('initMonitor');
    //   //   logger.info('事件執行順序：', events);
    //   // });
    //   // manager.on('containerReady', function () {
    //   //   events.push('containerReady');
    //   //   logger.info('事件執行順序：', events);
    //   // });
    //   // manager.on('startContainer', function () {
    //   //   events.push('startContainer');
    //   //   logger.info('事件執行順序：', events);
    //   // });
    //   // manager.on('monitoring', function () {
    //   //   events.push('monitoring');
    //   //   // 這應該是最後一個事件
    //   //   logger.info('事件執行	順序：', events);
    //   //   //done();
    //   // });
    //
    //   manager.init();
    // });
  });


  function addNewMonitor() {
    var mo = managerOptions.masterOptions,
      args1 = ['-h', managerOptions.host,
        '-p', managerOptions.port,
        'sentinel', 'monitor', managerOptions.masterName, mo.ip, mo.port, mo.quorum
      ],
      args2 = ['-h', managerOptions.host,
        '-p', managerOptions.port,
        'sentinel', 'set', managerOptions.masterName, 'auth-pass', managerOptions.master_auth_pass
      ];
    // 建立 monitor
    async.series([
      function (cb) {
        execSpawn('redis-cli', args1);
      },
      function (cb) {
        execSpawn('redis-cli', args2);
      }
    ], function (err, result) {
      logger.info('建立 monitor', err, result);
    });

    // execSpawn('redis-cli', args, function (err) {
    //   if (err) return logger.error('手動建立 sentinel monitor 錯誤');
    //
    //   execSpawn('redis-cli', );
    // });

  }

  function removeMonitor() {
    var args = ['-h', managerOptions.host,
      '-p', managerOptions.port,
      'sentinel', 'remove', managerOptions.masterName
    ];
    execSpawn('redis-cli', args, function (err) {
      if (err) logger.error('手動刪除 sentinel monitor 錯誤');
    });
  }

});

function execSpawn(cmd, args, cb) {
  var p = spawn(cmd, args);
  var err = null;
  p.stdout.on('data', logger.debug);
  p.stderr.on('data', function (data) {
    err = data;
  });
  p.on('close', function (code) {
    logger.debug('remove monitor code:', code);
    if (cb != null) {
      cb((code != 0) ? err : null);
    }
  });
}