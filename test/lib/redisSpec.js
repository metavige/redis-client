var expect = require('chai').expect;
var RedisProcess = require('../../lib/redis');

describe('Redis Processor - ', function () {
    var redisProcess = new RedisProcess();

    describe('config - ', function () {
        it('預設設定', function () {
            expect(redisProcess)
                .to.have.a.property('config');
        });

        it('api default host config', function () {
            expect(redisProcess.config.api)
                .to.have.a.property('host', 'http://127.0.0.1');
            expect(redisProcess.config.api)
                .to.have.a.property('port', 80);
        });

        var otherRedisProcess = new RedisProcess({
            api: {
                host: 'http://localhost',
                port: 123
            }
        });

        it('set config from constructor arguments', function () {
            expect(otherRedisProcess.config.api)
                .to.have.a.property('host', 'http://localhost');
            expect(otherRedisProcess.config.api)
                .to.have.a.property('port', 123);
        });

    });


    describe("Command Test", function () {

        it('預設產生的參數應該要是合乎 redis-server 的規範', function () {
            var command = redisProcess.makeCommand({
                port: 6379,
                memory: 100
            });

            expect(command)
                .to.equals('redis-server --port 6379 --maxmemory 100mb &');
        });
    });

    describe('Redis Test', function () {

        it('Test Redis Exist', function () {
        
            
        });
    });

});