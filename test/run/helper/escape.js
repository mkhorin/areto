/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const EscapeHelper = require('../../../helper/EscapeHelper');

describe('EscapeHelper', ()=> {

    it('escapeHtml: set special symbols as simple string', ()=> {
        const res = EscapeHelper.escapeHtml('<div>test</div>');
        expect(res).to.eql('&lt;div&gt;test&lt;/div&gt;');
    });

    it('escapeRegex: set special symbols as simple string', ()=> {
        let res = EscapeHelper.escapeRegex('^test{1}$');
        res = (new RegExp(res)).test('^test{1}$');
        expect(res).to.eql(true);
    });

    it('toRegex', ()=> {
        expect(EscapeHelper.toRegex('test').source).to.eql('^test$');
        expect(EscapeHelper.toRegex('%test').source).to.eql('test$');
        expect(EscapeHelper.toRegex('test%').source).to.eql('^test');
        expect(EscapeHelper.toRegex('%test%').source).to.eql('test');
        const test = new RegExp('test');
        expect(EscapeHelper.toRegex(test)).to.eql(test);
    });
});