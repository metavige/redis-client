/**
 * api /ping Route
 *
 * Created by rickychiang on 14/12/27.
 */

// =======================================================
// Module dependencies
// =======================================================
var router = require('express').Router();

(function() {

    module.exports = function(webApp) {

        router.route('/')
            .get(function(req, res) {
                res.send('PONG');
            });

        return router;
    };

})();
