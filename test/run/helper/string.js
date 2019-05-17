/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const StringHelper = require('../../../helper/StringHelper');

describe('StringHelper', ()=> {

    it('toFirstUpperCase: capitalize the first letter', ()=> {
        let res = StringHelper.toFirstUpperCase('up first');
        expect(res).to.eql('Up first');
    });

    it('toFirstLowerCase: lowercase the first letter', ()=> {
        let res = StringHelper.toFirstLowerCase('Low first');
        expect(res).to.eql('low first');
    });

    it('toWordFirstUpperCase: capitalize the first letters', ()=> {
        let res = StringHelper.toWordFirstUpperCase('up first letters');
        expect(res).to.eql('Up First Letters');
    });

    it('camelize', ()=> {
        let res = StringHelper.camelize('test_block online');
        expect(res).to.eql('TestBlockOnline');
    });

    it('camelToWords', ()=> {
        let res = StringHelper.camelToWords('TestBlockOnline');
        expect(res).to.eql('Test Block Online');
    });

    it('camelToId', ()=> {
        let res = StringHelper.camelToId('TestBlockOnline');
        expect(res).to.eql('test-block-online');
    });

    it('idToCamel', ()=> {
        let res = StringHelper.idToCamel('test-block-online');
        expect(res).to.eql('TestBlockOnline');
    });

});