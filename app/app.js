#!/usr/bin/env node

var RedisAgent = require('./agent');

(function() {

    var agent = new RedisAgent();

    agent.init();

})();
