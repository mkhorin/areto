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

    it('capitalize: capitalize the first letter', ()=> {
        expect(StringHelper.capitalize('upper first letter')).to.eql('Upper first letter');
    });

    it('capitalizeWords: capitalize words', ()=> {
        expect(StringHelper.capitalizeWords('upper first letters')).to.eql('Upper First Letters');
    });

    it('toLowerCaseFirstLetter', ()=> {
        expect(StringHelper.toLowerCaseFirstLetter('LowerFirstLetter')).to.eql('lowerFirstLetter');
    });

    it('toLowerCamelCase', ()=> {
        expect(StringHelper.toLowerCamelCase('Test_my-block online')).to.eql('testMyBlockOnline');
    });

    it('toUpperCamelCase', ()=> {
        expect(StringHelper.toUpperCamelCase('test_my-block online')).to.eql('TestMyBlockOnline');
    });

    it('camelToWords', ()=> {
        expect(StringHelper.camelToWords('TestBlock.online-now')).to.eql('Test Block online now');
        expect(StringHelper.camelToWords('_first__dot..now')).to.eql('first dot now');
    });

    it('camelToKebab', ()=> {
        expect(StringHelper.camelToKebab('TestBlockOnline')).to.eql('test-block-online');
    });

    it('camelToSnake', ()=> {
        expect(StringHelper.camelToSnake('TestBlockOnline')).to.eql('test_block_online');
    });

    it('split', ()=> {
        expect(StringHelper.split('a,b, ,c, d,')).to.eql(['a', 'b', 'c', 'd']);
    });

    it('splitFirst', ()=> {
        expect(StringHelper.splitFirst('a.b.c')).to.eql(['a', 'b.c']);
        expect(StringHelper.splitFirst('a-b-c', '-')).to.eql(['a', 'b-c']);
        expect(StringHelper.splitFirst('abc')).to.eql(['abc']);
    });

    it('splitLast', () => {
        expect(StringHelper.splitLast('a.b.c')).to.eql(['a.b', 'c']);
        expect(StringHelper.splitLast('a-b-c', '-')).to.eql(['a-b', 'c']);
        expect(StringHelper.splitLast('abc')).to.eql(['abc']);
    });

    it('parseObject', ()=> {
        expect(StringHelper.parseObject('k1: v1, k2: v2')).to.eql({
            k1: 'v1',
            k2: 'v2'
        });
    });

    it('trimEnd', ()=> {
        expect(StringHelper.trimEnd('baseEnd', 'End')).to.eql('base');
        expect(StringHelper.trimEnd('other', 'End')).to.eql('other');
        expect(StringHelper.trimEnd('other')).to.eql('other');
        expect(StringHelper.trimEnd(null)).to.eql('null');
    });
});