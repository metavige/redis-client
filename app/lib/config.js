var fs = require('fs'),
    path = require('path'),
    logger = require(path.join(__dirname, './logger'));

var config = {};

config.settings = {};

logger.debug('start agent.....');

// read conf/config.json
try {
    // console.log(__dirname);
    var data = fs.readFileSync(path.join(__dirname, '/../../conf/config.json'), 'utf8');
    console.log('read config.json', data);
    config.settings = JSON.parse(data.toString());
} catch (err) {
    logger.error(err);
    throw err;
}

config.saveContainerInfo = function(info) {
    config.settings.container = {
        id: info.containerId,
        type: info.containerType
    };
};

config.saveInstance = function(instInfo) {
    // TODO: save instance data to instance.json
};

config.isProxy = function() {
    return (config.settings.container.type === 'proxy');
}

module.exports = config;
