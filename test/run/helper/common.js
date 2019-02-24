/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const CommonHelper = require('../../../helper/CommonHelper');

describe('CommonHelper', ()=> {

    it('isEmpty', ()=> {
        expect(CommonHelper.isEmpty(null)).to.eql(true);
        expect(CommonHelper.isEmpty(undefined)).to.eql(true);
        expect(CommonHelper.isEmpty('')).to.eql(true);
        expect(CommonHelper.isEmpty(0)).to.eql(false);
        expect(CommonHelper.isEmpty([])).to.eql(false);
        expect(CommonHelper.isEmpty('test')).to.eql(false);
    });

    it('getRandom', ()=> {
        let res = CommonHelper.getRandom(5, 10);
        expect(res).to.be.within(5,10);
    });

    it('parseJson', ()=> {
        let res = CommonHelper.parseJson(JSON.stringify({a: 5}));
        expect(res.a).to.eql(5);
        res = CommonHelper.parseJson('non-json');
        expect(res).to.eql(undefined);
    });

    it('escapeRegExp: set special symbols as simple string', ()=> {
        let result = CommonHelper.escapeRegExp('^test{1}$');
        result = (new RegExp(result)).test('^test{1}$');
        expect(result).to.eql(true);
    });

    it('escapeHtml: set special symbols as simple string', ()=> {
        let result = CommonHelper.escapeHtml('<div>test</div>');
        expect(result).to.eql('&lt;div&gt;test&lt;/div&gt;');
    });
});