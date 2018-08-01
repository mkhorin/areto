'use strict';

const expect = require('chai').expect;
const StringHelper = require('../../../helper/StringHelper');

describe('helpers.string', ()=> {

    it('toWordFirstUpperCase: capitalize first letters', ()=> {
        expect(StringHelper.toWordFirstUpperCase('up first letters')).to.equal('Up First Letters');
    });

    it('camelize', ()=> {
        expect(StringHelper.camelize('test_block online')).to.equal('TestBlockOnline');
    });

    it('camelToWords', ()=> {
        expect(StringHelper.camelToWords('TestBlockOnline')).to.equal('Test Block Online');
    });

    it('camelToId', ()=> {
        expect(StringHelper.camelToId('TestBlockOnline')).to.equal('test-block-online');
    });

    it('idToCamel', ()=> {
        expect(StringHelper.idToCamel('test-block-online')).to.equal('TestBlockOnline');
    });

});