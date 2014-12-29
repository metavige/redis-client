/**
 * container api - register command
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var util = require('util'),
    path = require('path'),
    _ = require('underscore');

var BaseCommand = require('./baseCommand');

(function(){

    function RegisterCommand(agent) {
        this.apiUrl = '';
        this.method = 'POST';

        this.setAgent(agent);
    }

    RegisterCommand.prototype.execute = function() {


    };

    module.exports = function(agent) {

        util.inherits(RegisterCommand, BaseCommand);

        return new RegisterCommand(agent);
    };
})();