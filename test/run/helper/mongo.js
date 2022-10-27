/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const MongoHelper = require('../../../helper/MongoHelper');

describe('MongoHelper', ()=> {

    it('includes', ()=> {
        const value = '6358ebf995a41e93c165e5db';
        const target = MongoHelper.createId(value);
        const source = MongoHelper.createId(value);

        expect(target === source).to.eql(false);
        expect(target.toString() === source).to.eql(false);
        expect(target === source.toString()).to.eql(false);
        expect(target.toString() === source.toString()).to.eql(true);

        const sources = [source];
        expect(MongoHelper.includes(target, sources)).to.eql(true);
        expect(MongoHelper.includes(target.toString(), sources)).to.eql(true);
        expect(MongoHelper.includes(target, sources.join('').split(','))).to.eql(true);
    });

    it('convertToRegex', ()=> {
        const convert = MongoHelper.convertToRegex.bind(MongoHelper);
        expect(convert('test').source).to.eql('^test$');
        expect(convert('%test').source).to.eql('test$');
        expect(convert('test%').source).to.eql('^test');
        expect(convert('%test%').source).to.eql('test');
        const test = new RegExp('test');
        expect(convert(test)).to.eql(test);
    });
});