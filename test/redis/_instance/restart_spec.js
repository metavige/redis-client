// var expect = require('expect.js'),
//     exec = require('child_process').exec,
//     path = require('path'),
//     fs = require('fs'),
//     logger = require(path.join(__dirname, '../../logger')),
//     Command = require(path.join(__dirname, '../../../app/redis/instance/restart'));

xdescribe('[測試 Redis 重啟]', function() {
    //
    //     var options = {
    //         id: 'ABC',
    //         port: 123,
    //         mem: 100,
    //         pwd: '123',
    //         isMaster: false
    //     };
    //     var redisInfoData = "";
    //     // ==================================================
    //     // 測試初始化
    //     // ==================================================
    //     beforeEach(function() {
    //         redisInfoData = fs.readFileSync(
    //             path.join(__dirname, '../redis_info.out'), {
    //                 'encoding': 'utf8'
    //             });
    //     });
    //
    //     // ==================================================
    //     // 測試方法
    //     // ==================================================
    //     it('[測試 handle 方法可以正常運作]', function() {
    //         options.isMaster = true;
    //
    //         logger.debug('test data:', options);
    //         var command = new Command({
    //             logger: logger,
    //             spawnCommand: function(command, args, cb) {
    //                 cb(null, 'OK');
    //             },
    //             redisCli: function(port, auth, param, cb) {
    //                 // logger.debug('call redisCli:', arguments);
    //
    //                 // 因為 redis-cli info 已經在 create 的時候測試過，這邊就不再測試～
    //                 if (param[0] === 'info') {
    //                     // 因為是 call redis-cli info，要假裝回傳一個 redis info 的資料
    //                     cb(null, {
    //                         out: redisInfoData
    //                     });
    //                 }
    //
    //                 // 只測試 config 的部份
    //                 if (param[0] === 'config') {
    //                     expect().fail('不是 master, 不應該執行設定 MASTERAUTH');
    //                     cb(null);
    //                 }
    //             },
    //             api: function(url, data, cb) {
    //                 expect(url).to.be('instance.created');
    //                 expect(data.id).to.be(options.id);
    //
    //                 // 正常回應，讓流程可以往下
    //                 cb(null);
    //             }
    //         });
    //
    //         command.handle(options, function(err, result) {
    //             // logger.debug('call restart handle error:', err);
    //             expect((err == null)).to.be.ok();
    //         });
    //     });
    //
    //     it('[測試 handle 方法可以正常運作，當不是 Master 的時候]', function() {
    //         options.isMaster = false;
    //
    //         logger.debug('test data:', options);
    //         var command = new Command({
    //             logger: logger,
    //             spawnCommand: function(command, args, cb) {
    //                 cb(null, 'OK');
    //             },
    //             redisCli: function(port, auth, param, cb) {
    //                 // logger.debug('call redisCli:', arguments);
    //
    //                 // 因為 redis-cli info 已經在 create 的時候測試過，這邊就不再測試～
    //                 if (param[0] === 'info') {
    //                     // 因為是 call redis-cli info，要假裝回傳一個 redis info 的資料
    //                     cb(null, {
    //                         out: redisInfoData
    //                     });
    //                 }
    //
    //                 // 只測試 config 的部份
    //                 if (param[0] === 'config') {
    //                     expect(param).to.have.length(4);
    //                     expect(param[1]).to.be('set');
    //                     expect(param[2]).to.be('MASTERAUTH');
    //                     expect(param[3]).to.be(options.pwd);
    //
    //                     logger.debug('do config set.....');
    //                     cb(null, null);
    //                 }
    //             },
    //             api: function(url, data, cb) {
    //                 expect(url).to.be('instance.created');
    //                 expect(data.id).to.be(options.id);
    //
    //                 // 正常回應，讓流程可以往下
    //                 cb(null);
    //             }
    //         });
    //
    //         command.handle(options, function(err, result) {
    //             // logger.debug('call restart handle error:', err);
    //             expect((err == null)).to.be.ok();
    //         });
    //     });
    //
    //
});
