/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const EscapeHelper = require('../../../helper/EscapeHelper');

describe('EscapeHelper', ()=> {

    it('escapeHtml', ()=> {
        const res = EscapeHelper.escapeHtml('<div>test "name"</div>');
        expect(res).to.eql('&lt;div&gt;test &quot;name&quot;&lt;/div&gt;');
    });

    it('escapeRegex', ()=> {
        let res = EscapeHelper.escapeRegex('^test{1}$');
        res = (new RegExp(res)).test('^test{1}$');
        expect(res).to.eql(true);
        const test = new RegExp('test');
        expect(EscapeHelper.escapeRegex(test)).to.eql(test);
        expect(EscapeHelper.escapeRegex(['invalid value'])).to.eql('');
    });

    it('escapeTags', ()=> {
        const res = EscapeHelper.escapeTags('<div>test "name"</div>');
        expect(res).to.eql('&lt;div&gt;test "name"&lt;/div&gt;');
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