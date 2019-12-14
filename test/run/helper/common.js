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

    it('isEqual', ()=> {
        expect(CommonHelper.isEqual(2, 2)).to.eql(true);
        expect(CommonHelper.isEqual('2', 2)).to.eql(false);

        expect(CommonHelper.isEqual([1, 2, 3], [1, 2, 3])).to.eql(true);
        expect(CommonHelper.isEqual([3, 2, 1], [1, 2, 3])).to.eql(false);

        expect(CommonHelper.isEqual({k: 1, m: 2}, {k: 1, m: 2})).to.eql(true);
        expect(CommonHelper.isEqual({m: 2, k: 1}, {k: 1, m: 2})).to.eql(false);
    });

    it('parseJson', ()=> {
        const res = CommonHelper.parseJson(JSON.stringify({a: 5}));
        expect(res.a).to.eql(5);
        expect(CommonHelper.parseJson('non-json')).to.eql(undefined);
    });
});