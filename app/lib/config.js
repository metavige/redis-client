var fs = require('fs');

var config = {};

config.settings = {};

console.log('start agent.....');

// read conf/config.json
try {
    // console.log(__dirname);
    var data = fs.readFileSync(__dirname + '/../../conf/config.json', 'utf8');
    config.settings = JSON.parse(data.toString());
} catch (err) {
    throw err;
}

config.saveContainerInfo = function(info) {
    config.container = {
        id: info.containerId,
        type: info.containerType
    };
};

module.exports = config;
