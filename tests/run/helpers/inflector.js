'use strict';

const expect = require('chai').expect;
const InflectorHelper = require('../../../helpers/InflectorHelper');

describe('helpers.inflector', ()=> {

    it('ucwords: capitalize first letters', ()=> {
        expect(InflectorHelper.ucwords('up first letters')).to.equal('Up First Letters');
    });

    it('camelize', ()=> {
        expect(InflectorHelper.camelize('test_block online')).to.equal('TestBlockOnline');
    });

    it('camelToWords', ()=> {
        expect(InflectorHelper.camelToWords('TestBlockOnline')).to.equal('Test Block Online');
    });

    it('camelToId', ()=> {
        expect(InflectorHelper.camelToId('TestBlockOnline')).to.equal('test-block-online');
    });

    it('idToCamel', ()=> {
        expect(InflectorHelper.idToCamel('test-block-online')).to.equal('TestBlockOnline');
    });

});