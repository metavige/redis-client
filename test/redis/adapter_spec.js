var testCommon = require('../commons'),
    expect = testCommon.expect,
    _ = testCommon._,
    RedisAdapter = testCommon.getTestClass('redis/adapter'),
    RedisManager = testCommon.getTestClass('redis/redisManager');

describe('[測試 Redis Adapter]', function() {
    describe('[測試 Manager 管理]', function() {

        var adapter = new RedisAdapter();

        beforeEach(function() {
            adapter._redisManagers = {
                'ABC': new RedisManager()
            };
        });

        afterEach(function() {
            adapter._redisManagers = {}; // clear
        });

        it('[isExist]', function() {

            expect(!adapter.isManagerExist('redis')).to.be.ok();
            expect(adapter.isManagerExist('redis', 'ABC')).to.be.ok();
        });

        it('[addManager]', function() {
            var m = new RedisManager();
            var returnManager = adapter.addManager('redis', '123', m);

            expect(adapter.getManager('redis', 123)).to.eql(m);
            expect(_.map(adapter._redisManagers).length).to.eql(
                2);
        });
    });

    describe('[測試 Command 建立]', function() {
        var MockAgent = function() {
            this.once('error', function() {
                this.emit('testError');
            });
        };

        testCommon.extendEventEmitter(MockAgent);

        var mockAgent = new MockAgent(),
            adapter = new RedisAdapter(mockAgent);

        it('[建立 redis/instance/create Command]', function() {
            var options = {
                id: 'ABC',
                port: 6379,
                mem: 100
            };
            adapter.emit('instance.create', options, function(err) {
                // Callback ...
                expect((err == null)).to.be.ok();
            });
        });

        it('[建立一個錯誤的 Command]', function(done) {
            // 提供一個假的 Command Class
            adapter._getCommandClass = function(name) {
                logger.debug('呼叫了 _getCommandClass', name);
                if (name != 'instance.create') return null;

                return function() {
                    this.handle = function() {}
                };
            }

            // 如果建立的錯誤的 Command, 應該要觸發 Agent 的錯誤事件
            mockAgent.once('error', function(cmdName) {
                expect(cmdName).to.eql('non/command/exist');
                done();
            });

            adapter.emit('non.command.exist', {});
        });
    });

    describe('[測試 API Call]', function() {

        it('[呼叫 Api 方法，確認有觸發事件]', function(done) {
            var MockAgent = function() {
                this.on('container::test', function() {
                    expect(arguments.length).to.eql(2);
                    expect(arguments[0]).to.eql(123);
                    expect(arguments[1]).to.eql('ABC');
                    done();
                });
            };
            testCommon.extendEventEmitter(MockAgent);

            var mockAgent = new MockAgent();
            var adapter = new RedisAdapter(mockAgent);

            adapter.api('test', 123, 'ABC');
        });
    });
});
