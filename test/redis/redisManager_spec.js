var testCommon = require('../commons'),
  expect = testCommon.expect,
  logger = testCommon.logger,
  RedisManager = testCommon.getTestClass('redis/redisManager');

describe('[測試 REDIS Instance]', function () {

  var testPort = 6379;
  var redisManager;

  afterEach(function () {
    // killRedisServer(testPort);
    killRedisServer(9998);
  });

  describe('[測試監控]', function () {

    beforeEach(function () {
      redisManager = new RedisManager();
      // killRedisServer(testPort);
    });

    afterEach(function () {
      redisManager.close();
      // killRedisServer(testPort);
      redisManager = null;
    });

    it('[Agent 重新啟動，連線到一個既存的 REDIS]', function (done) {
      // 先啟動一個新的 redis server 來測試
      // exec('redis-server --port ' + testPort + ' --daemonize yes',
      //     function(error, stdout, stderr) {
      //         console.log('stdout: ' + stdout);
      //         console.log('stderr: ' + stderr);
      // 建立成功之後，才做測試～
      // if (error == null) {
      // logger.debug('建立 REDIS......');

      redisManager.init({
        id: 'abc',
        port: testPort,
        mem: '100mb'
      });

      // 接聽第一次 rti 事件
      redisManager.once('rti', function (info) {
        logger.debug('rti event: ', info);
        expect(redisManager.isStarted()).to
          .be.ok();
        done();
      });
      //     } else {
      //         expect().fail('無法測試，因為沒有 redis');
      //     }
      // });
    });


  });

  describe('[測試建立]', function () {

    var port = 9998;

    beforeEach(function () {
      // killRedisServer(port);
      // 修改啟動 redis 的選項
      redisManager = new RedisManager({
        getConf: function (options) {
          var cmdArgs = [
            '--port', options.port,
            '--daemonize', 'yes',
            '--maxmemory', options.mem + 'mb',
            '--requirepass', options.pwd
          ];
          return cmdArgs;
        }
      });
    });

    afterEach(function () {
      redisManager.close();
      killRedisServer(port);
      redisManager = null;
    });

    it('[產生一個新的 REDIS]', function (done) {

      this.timeout(15000);

      redisManager.init({
        id: 'ABC',
        port: port,
        mem: 100,
        pwd: '123',
        isMaster: true
      });

      var isInited = false;

      redisManager.once('created', function () {
        logger.debug('REDIS 已經建立.....事件被觸發');
        // 應該要觸發 init 事件，因為要建立一個新的 redis
        isInited = true;
      });

      redisManager.once('rti', function (info) {
        delete info.listOnTimeout;
        logger.debug('自行建立一個新的 REDIS', info);
        expect(redisManager.isStarted()).to.be.ok();
        expect(isInited).to.be.ok();

        done();
      });

      // redisManager.once('ready', function() {
      //     // delete info.listOnTimeout;
      //     // logger.debug('自行建立一個新的 REDIS', info);
      //     expect(redisManager.isStarted()).to.be.ok();
      //     expect(isInited).to.be.ok();
      //
      //     done();
      // });

    });
  });

  function killRedisServer(port) {

    if (arguments.length == 0) port = testPort;

    var child = testCommon.spawn("bin/kill-redis", [port]);
    child.on('close', function (code) {
      console.log('kill redis:', port, code == 0);
    });
  }
});