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
        const method = EscapeHelper.escapeRegex;
        let res = method('^test{1}$');
        res = (new RegExp(res)).test('^test{1}$');
        expect(res).to.eql(true);
        const test = new RegExp('test');
        expect(method(test)).to.eql(test);
        expect(method(['invalid value'])).to.eql('');
    });

    it('escapeTags', ()=> {
        const res = EscapeHelper.escapeTags('<div>test "name"</div>');
        expect(res).to.eql('&lt;div&gt;test "name"&lt;/div&gt;');
    });
});