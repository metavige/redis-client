var expect = require('expect.js'),
    exec = require('child_process').exec,
    path = require('path'),
    fs = require('fs'),
    logger = require(path.join(__dirname, '../../logger')),
    Command = require(path.join(__dirname, '../../../app/redis/instance/create'));

describe('[測試 Redis 建立]', function() {

    var options = {
        id: 'ABC',
        port: 123,
        mem: 100,
        pwd: '123'
    };
    // ==================================================
    // 測試初始化
    // ==================================================
    beforeEach(function() {
        // command = new Command(manager);
    });

    // ==================================================
    // 測試方法
    // ==================================================
    it('[測試 handle 方法可以正常運作]', function() {


        logger.debug('test data:', options);
        var command = new Command({
            logger: logger,
            spawnCommand: function(command, args, callback) {
                expect(command).to.be('redis-server');
                expect(args.length).to.be(16);

                callback(null);
            },
            redisCli: function(callback, port, auth, param) {
                logger.debug('call redisCli:', arguments);
                if (param[0] === 'info') {
                    expect(port).to.be(options.port);
                    expect(auth).to.be(options.pwd);

                    // 因為是 call redis-cli info，要假裝回傳一個 redis info 的資料
                    var redisInfoData = fs.readFileSync(
                        path.join(__dirname, '../redis_info.out'), {
                            'encoding': 'utf8'
                        });

                    // logger.debug('read sample redis info', redisInfoData);
                    callback(null, {
                        out: redisInfoData
                    });
                }
            },
            api: function(url, data, cb) {
                expect(url).to.be('instance.created');
                expect(data.id).to.be(options.id);
                // 正常回應，讓流程可以往下
                cb(null);
            },
            emit: function(evtName) {
                // bj6ej
                expect().fail('不應該發生錯誤');
            }
        });

        command.handle(options, function(err, result) {
            // logger.debug('call create handle error:', err);
            expect((err == null)).to.be.ok();
        });
    });

    it('[測試中斷 redis-server 建立]', function() {

        logger.debug('test data:', options);
        var command = new Command({
            logger: logger,
            spawnCommand: function(command, args, callback) {
                // expect(command).to.be('redis-server');
                // expect(args.length).to.be(16);

                // 回傳一個非 null 的物件用來當做錯誤發生
                callback(-1);
            },
            redisCli: function(callback, port, auth, param) {
                expect().fail('不應該執行下面的指令');
                logger.debug('要執行的命令: ', param);
            },
            api: function(url, data, cb) {
                // 正常回應，讓流程可以往下
                cb(null);
            },
            emit: function(evtName) {
                // 理論上有錯誤應該要觸發事件，用來作記錄
                expect(evtName).to.be('error');
            }
        });

        command.handle(options, function(err, result) {
            logger.debug('call restart handle error:', err);
            expect((err != null)).to.be.ok();
        });
    });
});
