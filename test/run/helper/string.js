/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const StringHelper = require('../../../helper/StringHelper');

describe('StringHelper', ()=> {

    it('generateLabel', ()=> {
        expect(StringHelper.generateLabel('name')).to.eql('Name');
        expect(StringHelper.generateLabel('firstSecond')).to.eql('First second');
        expect(StringHelper.generateLabel('_first-second.third')).to.eql('First second third');
    });

    it('toFirstUpperCase: capitalize the first letter', ()=> {
        expect(StringHelper.toFirstUpperCase('up first')).to.eql('Up first');
    });

    it('toFirstLowerCase: lowercase the first letter', ()=> {
        expect(StringHelper.toFirstLowerCase('Low first')).to.eql('low first');
    });

    it('toWordFirstUpperCase: capitalize the first letters', ()=> {
        expect(StringHelper.toWordFirstUpperCase('up first letters')).to.eql('Up First Letters');
    });

    it('camelize', ()=> {
        expect(StringHelper.camelize('test_block online')).to.eql('TestBlockOnline');
    });

    it('camelToWords', ()=> {
        expect(StringHelper.camelToWords('TestBlock.online-now')).to.eql('Test Block online now');
        expect(StringHelper.camelToWords('_first__dot..now')).to.eql('first dot now');
    });

    it('camelToId', ()=> {
        expect(StringHelper.camelToId('TestBlockOnline')).to.eql('test-block-online');
    });

    it('idToCamel', ()=> {
        expect(StringHelper.idToCamel('test-block-online')).to.eql('TestBlockOnline');
    });

    it('split', ()=> {
        expect(StringHelper.split('a,b, ,c, d,')).to.eql(['a', 'b', 'c', 'd']);
    });

    it('parseObject', ()=> {
        expect(StringHelper.parseObject('k1: v1, k2: v2')).to.eql({
            k1: 'v1',
            k2: 'v2'
        });
    });
});