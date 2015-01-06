var testCommon = require('../commons'),
  spawn = require('child_process').spawn,
  expect = testCommon.expect,
  logger = testCommon.logger,
  DockerUtils = testCommon.getTestClass('redis/dockerUtils'),
  SentinelManager = testCommon.getTestClass('redis/sentinelManager');

describe('[測試 Sentinel Manager]', function () {

  var manager = null,
    dockerUtils = new DockerUtils({
      host: 'http://192.168.0.146',
      port: 4243
    });

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

  describe('[測試建立 Sentinel Monitor]', function (done) {

    var managerOptions = {
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

    afterEach(function () {
      manager.close();

      var p = spawn('redis-cli', ['-h', '192.168.0.146',
        '-p', '6380',
        'sentinel', 'remove', managerOptions.masterName
      ]);
      p.stdout.on('data', logger.debug);
      p.stderr.on('data', logger.error);
      p.on('close', function (code) {
        logger.debug('remove monitor code:', code);
      });
    });

    it('[第一次檢查 MasterName 不存在，應該要設定 monitor]', function () {

      manager = new SentinelManager(managerOptions);

      manager.on('error', function (err) {
        // logger.error('執行發生錯誤', err);
      });

      var _triggerInitMonitor = false;
      manager.on('initMonitor', function () {
        // 應該要觸發 initMonitor 事件
        _triggerInitMonitor = true;
      });

      manager.on('masterInfo', function (info) {
        expect(info != null).to.be.ok();
        // expect(_triggerInitMonitor).to.be.ok();
        logger.info('getMasterInfo! ', info);
      });

      manager.init();
    });
  })
});