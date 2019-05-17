/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const IndexHelper = require('../../../helper/IndexHelper');

describe('IndexHelper', ()=> {

    it('indexObjects', ()=> {
        let items = [
            {id: 4, val: 10},
            {id: 5, val: 15},
            {id: 6, val: 15},
            {id: 7, val: 20}
        ];
        let res = IndexHelper.indexObjects(items, 'val');
        expect(res[10]).to.eql(items[0]);
        expect(res[15]).to.eql([items[1], items[2]]);
        expect(res[20]).to.eql(items[3]);
        res = IndexHelper.indexObjects(items, 'val', 'id');
        expect(res[10]).to.eql(4);
        expect(res[15]).to.eql([5, 6]);
        expect(res[20]).to.eql(7);
    });

    it('indexUniqueKeyObjects', ()=> {
        let items = [
            {id: 4, val: 10},
            {id: 5, val: 15},
            {id: 6, val: 20}
        ];
        let res = IndexHelper.indexUniqueKeyObjects(items, 'val');
        expect(res[10]).to.eql(items[0]);
        expect(res[15]).to.eql(items[1]);
        expect(res[20]).to.eql(items[2]);
        res = IndexHelper.indexUniqueKeyObjects(items, 'val', 'id');
        expect(res[10]).to.eql(4);
        expect(res[15]).to.eql(5);
        expect(res[20]).to.eql(6);
    });
});