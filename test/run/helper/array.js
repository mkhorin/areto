/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const ArrayHelper = require('../../../helper/ArrayHelper');

describe('ArrayHelper', ()=> {

    it('diff', ()=> {
        let res = ArrayHelper.diff([1, 2, 3, 4, 5], [2, 4]);
        expect(res).to.eql([1, 3, 5]);
    });

    it('intersect', ()=> {
        let res = ArrayHelper.intersect([1, 2, 3, 4, 5], [6, 3, 8, 2]);
        expect(res).to.eql([2, 3]);
    });

    it('unique', ()=> {
        let res = ArrayHelper.unique([1, 2, 1, 3, 2]);
        expect(res).to.eql(['1', '2', '3']);
    });

    it('uniqueStrict', ()=> {
        let res = ArrayHelper.uniqueStrict([1, 2, 1, 3, 2]);
        expect(res).to.eql([1, 2, 3]);
    });

    it('flip', ()=> {
        let res = ArrayHelper.flip([1, 2, 3]);
        expect(res).to.eql({
            1: 0,
            2: 1,
            3: 2
        });
    });

    it('removeValue', ()=> {
        let items = [1, 2, 3, 4];
        expect(ArrayHelper.removeValue(3, items)).to.eql(true);
        expect(items).to.eql([1, 2, 4]);
        expect(ArrayHelper.removeValue(5, items)).to.eql(false);
    });

    it('concatValues', ()=> {
        let res = ArrayHelper.concatValues([1, [2, 3], 4]);
        expect(res).to.eql([1, 2, 3, 4]);
        expect(ArrayHelper.concatValues(3)).to.eql(3);
    });

    it('getObjectPropValues', ()=> {
        let items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 20}
        ];
        let res = ArrayHelper.getObjectPropValues(items, 'val');
        expect(res).to.eql([10, 15, 20]);
    });

    it('searchByProp', ()=> {
        let items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 20}
        ];
        let res = ArrayHelper.searchByProp(15, 'val', items, 'id');
        expect(res).to.eql(2);
    });

    // RANDOM

    it('getRandom', ()=> {
        let res = ArrayHelper.getRandom([7, 8, 9]);
        expect(res).to.be.within(7, 9);
    });

    it('shuffle', ()=> {
        let res = ArrayHelper.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(res).to.lengthOf(9);
        expect(res).to.not.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });
});