/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const EscapeHelper = require('../../../helper/EscapeHelper');

describe('EscapeHelper', ()=> {

    it('escapeHtml: set special symbols as simple string', ()=> {
        let result = EscapeHelper.escapeHtml('<div>test</div>');
        expect(result).to.eql('&lt;div&gt;test&lt;/div&gt;');
    });

    it('escapeRegExp: set special symbols as simple string', ()=> {
        let result = EscapeHelper.escapeRegExp('^test{1}$');
        result = (new RegExp(result)).test('^test{1}$');
        expect(result).to.eql(true);
    });
});