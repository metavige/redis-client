/**
 * Redis Adapter
 *
 * 用來管理 Redis/Sentinel/Proxy
 *
 * Created by rickychiang on 14/12/29.
 */

// =======================================================
// Module dependencies
// =======================================================
var commons = require('../base/commons'),
	util = require('util'),
	path = require('path'),
	_ = require("underscore");

(function() {

	function Adapter(agent) {

		Adapter.super_.call(this, {
			wildcard: true,
			delimiter: '::'
		});
		// =======================================================
		// Fields
		// =======================================================
		var _agent = agent,
			_self = this,
			logger = this.logger = commons.logger;

		this._redisManagers = {};
		this._sentinelManagers = {};
		this._proxyManagers = {};

		// =======================================================
		// Public Methods
		// =======================================================

		/**
		 * 提供呼叫 ContainerApi 的方法
		 *
		 * 為了統一所有觸發 agent 的事件，不需要每個 command 都去做～
		 *
		 * @return {[type]} [description]
		 */
		this.api = function() {
			var args = _.map(arguments);
			args[0] = 'container::' + args[0];

			logger.debug('call container api:', args);
			agent.emit.apply(agent, args);
		};

		/**
		 * 檢查 Manager 是否存在～
		 * @param {[type]} type      [description]
		 * @param {[type]} managerId [description]
		 */
		this.isManagerExist = function(type, managerId) {
			return this.getManager(type, managerId) != null;
		}

		/**
		 * 取得 Manager
		 * @param {[type]} type      [description]
		 * @param {[type]} managerId [description]
		 */
		this.getManager = function(type, managerId) {
			var managers = this['_' + type + 'Managers'];
			if (managers[managerId]) {
				return managers[managerId];
			}
			return null;
		};

		/**
		 * 新增 Manager
		 * @param {[type]} type    [description]
		 * @param {[type]} id      [description]
		 * @param {[type]} manager [description]
		 */
		this.addManager = function(type, id, manager) {
			var managers = this['_' + type + 'Managers'];
			managers[id] = manager;

			return manager;
		}

		// =======================================================
		// Events
		// =======================================================

		this.onAny(function() {
			var args = _.map(arguments);

			logger.debug('[MANAGER]', this.event, args);

			// 觸發錯誤事件
			if (this.event == 'error') {
				this._error(args);
				return;
			}

			if (this.event == 'close') {
				this._close();
				return;
			}

			// 事件名稱就是實際的 Command 名稱，
			// 執行 Command Handle
			try {
				var cmdName = this.event.replace(/\./g, '/');
				var Command = this._getCommandClass(cmdName);
				logger.debug('Get Command Class:', Command);
				if (Command !== null) {
					new Command(_self).handle.apply(cmd, args);
				}
			} catch (ex) {
				agent.emit('error', cmdName, ex);
			}
		});

		// =======================================================
		// Internal Methods
		// =======================================================

		this._getCommandClass = function(name) {
			try {
				logger.debug('prepare create command:', name);
				var Command = require(path.join(__dirname, name));

				return Command;
			} catch (ex) {
				logger.error('Command [' + name + '] 不存在或無法建立！');
				return null;
			}
		};

		this._error = function(args) {
			args.unshift('error');
			_self.agent.emit.apply(_self.agent, args);
		};

		this._close = function() {
			// 逐一關閉 Manager
			_.forEach(this._redisManagers, function(v) {
				v.close();
			});
			_.forEach(this._sentinelManagers, function(v) {
				v.close();
			});
			_.forEach(this._proxyManagers, function(v) {
				v.close();
			});
		};
	}

	commons.extendEventEmitter2(Adapter);

	// export adapter
	module.exports = Adapter;
})();
