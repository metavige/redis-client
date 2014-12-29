/**
 * Resource Container Register
 *
 * 呼叫 ContainerApi 做註冊 Container
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================

(function() {

    function RegisterContainerCommand(proxy) {
        this.proxy = proxy;
    }

    RegisterContainerCommand.prototype.handle = function(data, cb) {

        console.log('call register container....');
        cb({
            id: 'abc'
        });
    };

    module.exports = RegisterContainerCommand;

})();
