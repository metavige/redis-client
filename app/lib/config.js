var fs = require('fs');

var config = {};

config.settings = {};

console.log('start agent.....');

// read conf/config.json
try {
    // console.log(__dirname);
    var data = fs.readFileSync(__dirname + '/../conf/config.json', 'utf8');
    config.settings = JSON.parse(data.toString());

    // console.log(JSON.parse(data));
    // TODO: Register Container
    // config.container = {
    // id: '4a7a93ee-195f-4f5e-bb06-279983a5534c',
    // type: 0
    // };
    // console.log('api root:', config.settings.apiRoot);
} catch (err) {
    throw err;
}

config.saveContainerInfo = function(info) {
    config.container = {
        id: info.containerId,
        type: info.containerType
    };

    // fs.writeFileSync(__dirname + '/../conf/container.json', 'utf8', config.container);
};

module.exports = config;
