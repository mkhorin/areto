'use strict';

let expect = require('chai').expect;
let helper = require('../../../helpers/InflectorHelper');

describe('helpers.inflector', ()=> {

    it('ucwords: capitalize first letters', ()=> {
        expect(helper.ucwords('up first letters')).to.equal('Up First Letters');
    });

    it('camelize', ()=> {
        expect(helper.camelize('test_block online')).to.equal('TestBlockOnline');
    });

    it('camelToWords', ()=> {
        expect(helper.camelToWords('TestBlockOnline')).to.equal('Test Block Online');
    });

    it('camelToId', ()=> {
        expect(helper.camelToId('TestBlockOnline')).to.equal('test-block-online');
    });

    it('idToCamel', ()=> {
        expect(helper.idToCamel('test-block-online')).to.equal('TestBlockOnline');
    });

});