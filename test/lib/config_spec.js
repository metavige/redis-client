var expect = require('expect.js');
var config = require('../../app/lib/config');

describe('read config.json', function() {

    it('check property', function() {

        expect(config.settings).to.be.ok();
        expect(config.settings).to.have.property("apiRoot");
        expect(config.settings).to.have.property("type");
    });

});
