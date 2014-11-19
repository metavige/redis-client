var chaiExpect = require('chai').expect;
var expect = require('expect.js');
var exec = require('child_process').exec;
var RedisAdapter = require('../../app/lib/redis');

describe('Redis Adapter', function () {
    var redisAdapter = null;

    beforeEach(function () {
        redisAdapter = new RedisAdapter();
    });

    /**
     * 測試 init config
     */
    describe('Config', function () {

        it('預設設定', function () {
            chaiExpect(redisAdapter)
                .to.have.a.property('config');
        });

        it('api default host config', function () {
            chaiExpect(redisAdapter.config.api)
                .to.have.a.property('host', 'http://127.0.0.1');
            chaiExpect(redisAdapter.config.api)
                .to.have.a.property('port', 80);
        });

        var otherRedisAdapter = new RedisAdapter({
            api: {
                host: 'http://localhost',
                port: 123
            }
        });

        it('set config from constructor arguments', function () {
            chaiExpect(otherRedisAdapter.config.api)
                .to.have.a.property('host', 'http://localhost');
            chaiExpect(otherRedisAdapter.config.api)
                .to.have.a.property('port', 123);
        });

    });

    /**
     * 測試 Redis Command
     */
    describe("MakeCommand Test", function () {

        it('預設產生的參數應該要是合乎 redis-server 的規範', function () {
            var command = redisAdapter.makeCommand({
                port: 6379,
                memory: 100
            });

            expect(command)
                .to.contain('--port 6379');

            expect(command)
                .to.contain('--maxmemory 100mb');
        });

    });

    /**
     * 測試 Redis Process 檢查
     */
    describe('Redis Process Check Test', function () {

        describe('測試連線 Redis', function () {

            beforeEach(function () {
                exec('redis-server --port 6380 &',
                    function (error, stdout, stderr) {
                        console.log('start test redis-server :', error, stdout, stderr);
                    });
            });

            afterEach(function () {
                exec('kill $(ps -A -f | grep redis-server |  grep "*:6380" | awk \'{print $2}\')',
                    function (error, stdout, stderr) {
                        console.log('remove test redis-server :', error, stdout, stderr);
                    });
            });

            it('client test', function () {
                var options = {
                    host: 'localhost',
                    port: 6379
                };

                redisAdapter.check(options, function (result) {

                    console.log('client test result: ', result);
                    chaiExpect(result).equals(true);
                });
            });
        });

        describe('測試 Redis 連線不存在', function () {

            beforeEach(function () {
                exec('kill $(ps -A -f | grep redis-server |  grep "*:6380" | awk \'{print $2}\')',
                    function (error, stdout, stderr) {
                        console.log('remove test redis-server :', error, stdout, stderr);
                    });
            });

            it('client test', function () {
                var options = {
                    host: 'localhost',
                    port: 6380
                };

                redisAdapter.check(options, function (result) {

                    console.log('client test result: ', result);
                    chaiExpect(result).equals(false);
                });
            });

        });
    });

});
