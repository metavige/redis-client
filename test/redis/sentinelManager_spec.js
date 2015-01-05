var testCommon = require('../commons'),
    expect = testCommon.expect,
    logger = testCommon.logger,
    DockerUtils = testCommon.getTestClass('redis/dockerUtils'),
    SentinelManager = testCommon.getTestClass('redis/sentinelManager');

describe('[測試 Sentinel Manager]', function() {

    var manager = new SentinelManager();

    describe('[測試 init]', function(done) {

        afterEach(function() {
            manager.close();
        })

        it('[測試 sentinel container 還未啟動]', function(done) {
            manager.removeListener('startContainer');

            manager.init();

            manager.once('startContainer', function() {
                // 如果還沒啟動 container, 就要先觸發 startContainer 事件
                done();
            });
        });

        it('[測試 sentinel container 已經啟動]', function(done) {
            manager.removeListener('containerReady');

            manager.init();

            manager.once('containerReady', function() {
                // 如果還沒啟動 container, 就要先觸發 startContainer 事件
                done();
            });
        });
    });
});
