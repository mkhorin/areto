/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const IndexHelper = require('../../../helper/IndexHelper');

describe('IndexHelper', ()=> {

    it('indexObjects', ()=> {
        const items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 15},
            {id: 4, val: 20}
        ];
        let res = IndexHelper.indexObjects(items, 'val');
        expect(res[10]).to.eql(items[0]);
        expect(res[15]).to.eql(items[2]);
        expect(res[20]).to.eql(items[3]);

        res = IndexHelper.indexObjects(items, 'val', 'id');
        expect(res[10]).to.eql(1);
        expect(res[15]).to.eql(3);
        expect(res[20]).to.eql(4);
    });
    
    it('indexObjectArrays', ()=> {
        const items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 15},
            {id: 4, val: 20}
        ];
        let res = IndexHelper.indexObjectArrays(items, 'val');
        expect(res[10]).to.eql([items[0]]);
        expect(res[15]).to.eql([items[1], items[2]]);
        expect(res[20]).to.eql([items[3]]);

        res = IndexHelper.indexObjectArrays(items, 'val', 'id');
        expect(res[10]).to.eql([1]);
        expect(res[15]).to.eql([2, 3]);
        expect(res[20]).to.eql([4]);
    });    
});