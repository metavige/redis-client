var Docker = require('dockerode');

(function() {

    var defaults = {
        socketPath: '/var/run/docker.sock'
    };

    function DockerUtils(dockerOptions) {
        // 設定初始值
        dockerOptions || (dockerOptions = {});
        Object.keys(defaults).forEach(function(def) {
            if (!dockerOptions[def]) dockerOptions[def] = defaults[def]
        });

        if (dockerOptions.host) {
            delete dockerOptions.socketPath;
        }

        var docker = new Docker(dockerOptions);

        /**
         * 取得一個 Container
         *
         * @param {[type]} containerId [description]
         */
        this.getContainer = function(containerId) {
            return docker.getContainer(containerId);
        }
    }

    module.exports = DockerUtils;
})();
