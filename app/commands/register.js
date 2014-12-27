/**
 * container api - register command
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var requestify = require('requestify'),
    util = require('util'),
    path = require('path'),
    _ = require('underscore');

var BaseCommand = require('./baseCommand');

(function(){

    function RegisterCommand() {
        this.apiUrl = '';

    }

    module.exports = function(agent) {

        util.inherits(RegisterCommand, BaseCommand);

        return RegisterCommand;
    };
})();