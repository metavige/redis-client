var fs = require('fs');

var config = module.exports = {};

config.settings = {};
/**
 * 初始化 agent, 主要是跟 container
 */
config.init = function () {
    console.log('start agent.....');

    // read conf/config.json
    fs.readFile('conf/config.json', 'utf-8', function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log('read config:', data);
        }

        config.settings = data;
    });
};
