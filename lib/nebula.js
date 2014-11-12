/**
    定義與 Resource Client 回報的方法

    author: ricky.chiang@quantatw.com
    date: 2014/11/12
 */

var http = require('http');

var resource = module.exports = {};


/**
 * 初始化，需要先跟 R.P. 註冊，取得唯一性的 ID
 * 之後呼叫 R.P. 的時候，會依照這個 ID 來判別是那一個 Client
 */
resource.init = function () {

};

/**
 * 與 Resource Provider 回報執行狀況
 * @param {Boolean} isError 是否有錯誤
 * @param {String}  stdout  stdout output
 * @param {String}  stderr  stderr output
 */
resource.updateStatus = function (isError, stdout, stderr) {
    // Send response to saas api, cause this is async call
    // res.send((error !== null) ? 'failed' : 'ok');
    var options = this.config.api || {
        path: '',
        method: 'POST'
    };
    console.log('options', options);

    var req = http.request(options, function (res) {

    });

    // req.write(JSON.stringify({
    //
    // }));

    req.end();
};
