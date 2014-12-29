/**
 * Redis Instance Created Api
 *
 * 呼叫 ContainerApi 做回報 Redis Instance 已經建立的狀態更新
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================

(function() {


    function InstanceCreatedCommand(proxy) {
        this.proxy = proxy;
    }

    InstanceCreatedCommand.prototype.handle = function(data) {

    };

    module.exports = InstanceCreatedCommand;

})();
