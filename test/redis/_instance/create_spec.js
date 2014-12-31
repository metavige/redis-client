// var expect = require('expect.js'),
//     exec = require('child_process').exec,
//     path = require('path'),
//     fs = require('fs'),
//     logger = require(path.join(__dirname, '../../logger')),
//     Command = require(path.join(__dirname, '../../../app/redis/instance/create'));

xdescribe('[測試 Redis 建立]', function() {
    //
    //     var options = {
    //         id: 'ABC',
    //         port: 123,
    //         mem: 100,
    //         pwd: '123'
    //     };
    //     var redisInfoData = '';
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
    //     it('[測試 handle 方法可以正常運作]', function(done) {
    //
    //         logger.debug('test data:', options);
    //         var command = new Command({
    //             logger: logger,
    //             spawnCommand: function(command, args, cb) {
    //                 expect(command).to.be('redis-server');
    //                 expect(args.length).to.be(16);
    //
    //                 cb(null, 'OK');
    //             },
    //             redisCli: function(port, auth, param, cb) {
    //                 // logger.debug('call redisCli:', arguments);
    //                 if (param[0] === 'info') {
    //                     expect(port).to.be(options.port);
    //                     expect(auth).to.be(options.pwd);
    //
    //                     // 因為是 call redis-cli info，要假裝回傳一個 redis info 的資料
    //
    //                     // logger.debug('read sample redis info', redisInfoData);
    //                     cb(null, {
    //                         out: redisInfoData
    //                     });
    //                 }
    //             },
    //             api: function(url, data, cb) {
    //                 expect(url).to.be('instance.created');
    //                 expect(data.id).to.be(options.id);
    //                 // 正常回應，讓流程可以往下
    //                 // logger.debug('call api .....');
    //                 cb(null);
    //             },
    //             emit: function(evtName) {
    //                 logger.debug('call emit!');
    //                 // bj6ej
    //                 expect().fail('不應該發生錯誤');
    //             }
    //         });
    //
    //         command.handle(options, function(err, result) {
    //             // logger.debug('call handle cb');
    //             // logger.debug('call create handle error:', err);
    //             expect((err == null)).to.be.ok();
    //
    //             done();
    //         });
    //     });
    //
    //     it('[測試中斷 redis-server 建立]', function(done) {
    //
    //         logger.debug('test data:', options);
    //         var command = new Command({
    //             logger: logger,
    //             spawnCommand: function(command, args, cb) {
    //                 // 回傳一個非 null 的物件用來當做錯誤發生
    //                 cb('ERROR!');
    //             },
    //             redisCli: function(port, auth, param, cb) {
    //                 expect().fail('不應該執行下面的指令');
    //                 logger.debug('要執行的命令: ', param);
    //             },
    //             api: function(url, data, cb) {
    //                 // 正常回應，讓流程可以往下
    //                 cb(null);
    //             },
    //             emit: function(evtName) {
    //                 logger.debug('call emit!');
    //                 // 理論上有錯誤應該要觸發事件，用來作記錄
    //                 expect(evtName).to.be('error');
    //             }
    //         });
    //
    //         command.handle(options, function(err, result) {
    //             logger.debug('call restart handle error:', err);
    //             expect((err != null)).to.be.ok();
    //
    //             done();
    //         });
    //     });
});
