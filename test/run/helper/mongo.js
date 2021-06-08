/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const MongoHelper = require('../../../helper/MongoHelper');

describe('MongoHelper', ()=> {

    it('convertToRegex', ()=> {
        const method = MongoHelper.convertToRegex;
        expect(method('test').source).to.eql('^test$');
        expect(method('%test').source).to.eql('test$');
        expect(method('test%').source).to.eql('^test');
        expect(method('%test%').source).to.eql('test');
        const test = new RegExp('test');
        expect(method(test)).to.eql(test);
    });
});