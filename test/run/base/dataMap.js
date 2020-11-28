/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const DataMap = require('../../../base/DataMap');

describe('DataMap', ()=> {

    it('has', ()=> {
        const res = new DataMap({a: 1, b: null, c: 0});
        expect(res.has('a')).to.eql(true);
        expect(res.has('b')).to.eql(true);
        expect(res.has('c')).to.eql(true);
        expect(res.has('toString')).to.eql(false);
        expect(res.has('none')).to.eql(false);
    });

    it('get', ()=> {
        const res = new DataMap({a: 1, b: 0});
        expect(res.get('a')).to.eql(1);
        expect(res.get('b')).to.eql(0);
        expect(res.get('none')).to.eql(undefined);
    });

    it('set', ()=> {
        const res = new DataMap;
        res.set('a', 2);
        expect(res.get('a')).to.eql(2);
    });

    it('push', ()=> {
        const res = new DataMap;
        res.push('a', 2);
        expect(res.get('a')).to.eql([2]);
        res.push('a', 3);
        expect(res.get('a')).to.eql([2, 3]);
    });

    it('unset', ()=> {
        const res = new DataMap;
        res.set('a', 2);
        res.unset('a');
        expect(res.has('a')).to.eql(false);
    });

    it('clear', ()=> {
        const res = new DataMap;
        res.set('a', 2);
        res.set('b', 3);
        res.clear();
        expect(res.has('a')).to.eql(false);
        expect(res.has('b')).to.eql(false);
    });

    it('assign', ()=> {
        const res = new DataMap({a: 1});
        res.assign({b: 2});
        res.assign(new DataMap({c: 3}));
        expect(res.get('a')).to.eql(1);
        expect(res.get('b')).to.eql(2);
        expect(res.get('c')).to.eql(3);
    });

    it('keys', ()=> {
        const res = new DataMap({a: 1, b: 2});
        expect(res.keys()).to.eql(['a', 'b']);
    });

    it('values', ()=> {
        const res = new DataMap({a: 1, b: 2});
        expect(res.values()).to.eql([1, 2]);
    });

    it('entries', ()=> {
        const res = new DataMap({a: 1, b: 2});
        expect(res.entries()).to.eql([['a', 1], ['b', 2]]);
    });

    it('size', ()=> {
        const res = new DataMap({a: 1, b: 2});
        expect(res.size()).to.eql(2);
    });

    it('each', ()=> {
        const res = new DataMap({a: 1, b: 2});
        const values = [];
        res.each(value => values.push(value));
        expect(values).to.eql([1, 2]);
    });

    it('forEach', ()=> {
        const res = new DataMap({a: 1, b: 2});
        const values = [];
        res.each(value => values.push(value));
        expect(values).to.eql([1, 2]);
    });

    it('filter', ()=> {
        const res = new DataMap({a: 1, b: 2, c: 3, d: 4});
        expect(res.filter(value => value > 2)).to.eql([3, 4]);
    });

    it('filterMap', ()=> {
        const data = new DataMap({a: 1, b: 2, c: 3, d: 4});
        const res = data.filterMap(value => value > 2);
        expect(res).to.be.an.instanceof(DataMap);
        expect(res.entries()).to.eql([['c', 3], ['d', 4]]);
    });

    it('map', ()=> {
        const res = new DataMap({a: 1, b: 2});
        expect(res.map(value => value + 1)).to.eql([2, 3]);
    });

    it('sort', ()=> {
        const res = new DataMap({a: 3, b: 1, c: 2});
        expect(res.sort((a, b) => a - b)).to.eql([1, 2, 3]);
    });

    it('Symbol.iterator', ()=> {
        const res = new DataMap({a: 1, b: 2});
        const values = [];
        for (const value of res) {
            values.push(value);
        }
        expect(values).to.eql([1, 2]);
    });
});