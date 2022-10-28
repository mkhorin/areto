/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
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

    it('defineConstantProperty', ()=> {
        const res = {};
        CommonHelper.defineConstantProperty(res, 'test', 1);
        expect(res.test).to.eql(1);
        expect(Object.values(res)).to.eql([1]);
        try { res.test = 2; } catch {}
        expect(res.test).to.eql(1);
        try { delete res.test; } catch {}
        expect(res.test).to.eql(1);
    });

    it('parseJson', ()=> {
        const res = CommonHelper.parseJson(JSON.stringify({a: 5}));
        expect(res.a).to.eql(5);
        expect(CommonHelper.parseJson('non-json')).to.eql(undefined);
    });

    it('parseRelationChanges', ()=> {
        const parse = CommonHelper.parseRelationChanges.bind(CommonHelper);

        expect(parse(null)).to.eql(null);
        expect(parse('')).to.eql(null);

        expect(parse('{"links": 1, "unlinks": [2, 3]}')).to.eql({links: [1], unlinks: [2, 3], deletes: []});
        expect(parse('{"links": [1, 2], "deletes": 3}')).to.eql({links: [1, 2], unlinks: [], deletes: [3]});

        expect(parse('1')).to.eql({links: [1], unlinks: [], deletes: []});
        expect(parse('ab')).to.eql({links: ['ab'], unlinks: [], deletes: []});
        expect(parse({links: 1})).to.eql({links: [1], unlinks: [], deletes: []});
        expect(parse([1, 2])).to.eql({links: [1, 2], unlinks: [], deletes: []});
    });

    it('resolveRelationChangeAction', ()=> {
        const d1 = {links: [1]};
        CommonHelper.resolveRelationChangeAction('links', d1);
        expect(d1).to.eql({links: [1]});

        const d2 = {links: 2};
        CommonHelper.resolveRelationChangeAction('links', d2);
        expect(d2).to.eql({links: [2]});

        const d3 = {};
        CommonHelper.resolveRelationChangeAction('links', d3);
        expect(d3).to.eql({links: []});
    });

    it('isRelationChangeUnique', ()=> {
        expect(CommonHelper.isRelationChangeUnique({
            links: [1, 2],
            unlinks: [3, 4],
            deletes: [5, 6]
        })).to.eql(true);

        expect(CommonHelper.isRelationChangeUnique({
            links: [1, 2],
            unlinks: [1, 4],
            deletes: [5, 6]
        })).to.eql(false);

        expect(CommonHelper.isRelationChangeUnique({
            links: [1, 2],
            unlinks: [3, 4],
            deletes: [5, 4]
        })).to.eql(false);
    });
});