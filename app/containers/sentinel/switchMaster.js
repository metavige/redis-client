/**
 * Sentinel 狀態更新 Api
 *
 * 呼叫 ContainerApi 做回報 Sentinel 設定已經建立的狀態更新
 *
 * Created by rickychiang on 14/12/30.
 */

// =======================================================
// Module dependencies
// =======================================================
var BaseCommand = require('../baseCommand'),
  util = require('util'),
  path = require('path'),
  _ = require('underscore');

(function () {

  function SwitchMasterCommand(proxy) {
    // call super ctor
    SwitchMasterCommand.super_.call(this, proxy);
  }
  util.inherits(SwitchMasterCommand, BaseCommand);

  /**
   * 呼叫 Container Api, 更新 Sentinel 狀態
   *
   * @param  {Object}   data { id, resId, status }
   * @param  {Function} cb   callback function
   */
  SwitchMasterCommand.prototype.handle = function (data, cb) {

    // 網址組合成 api/redisInfos/{resId}/switchMaster
    var url = path.join('/api/redisInfos', data['master-name'], 'switchMaster');
    logger.debug('switch master url: ', url, data);

    this.callApi(url, 'POST', data).then(function (res) {

      var statusCode = res.getCode();

      logger.debug('SwitchMasterCommand', statusCode);
      if (res.statusCode != 200) {
        cb('HTTP ' + statusCode, res.getBody());
      } else {
        cb(null);
      }
    });
  };

  module.exports = SwitchMasterCommand;
})();