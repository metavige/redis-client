var testCommon = require('../commons'),
    expect = testCommon.expect,
    logger = testCommon.logger,
    DockerUtils = testCommon.getTestClass('redis/dockerUtils');

xdescribe('[測試 DockerUtils]', function() {

    it('[取得一個不存在的 Container]', function(done) {
        var dockerUtils = new DockerUtils();

        var container = dockerUtils.getContainer('123');
        // logger.debug(container);
        // expect(container == null).to.be.ok();
        container.inspect(function(err, data) {
            expect(data == null).to.be.ok();
            done();
        });
    });

    it('[測試抓遠端的 docker]', function(done) {

        var dockerUtils = new DockerUtils({
            host: 'http://192.168.0.146',
            port: 4243
        });

        var container = dockerUtils.getContainer('sentinel');
        // logger.info('get remote sentinel container', container);
        // expect(container == null).to.be.ok();
        container.inspect(function(err, data) {
            // logger.info('container data:', JSON.stringify(data));
            logger.info('container running:', data.State.Running);
            expect(err == null).to.be.ok();
            done();
        });
    });
});
