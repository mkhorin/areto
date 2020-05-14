/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const ArrayHelper = require('../../../helper/ArrayHelper');

describe('ArrayHelper', ()=> {

    it('hasDiff', ()=> {
        expect(ArrayHelper.hasDiff([2, 4, 7, 4], [4, 7, 2, 2])).to.eql(false);
        expect(ArrayHelper.hasDiff([1, 2, 3], [2, 7])).to.eql(true);
    });

    it('diff', ()=> {
        expect(ArrayHelper.diff([2, 4, 7], [1, 2, 3, 4])).to.eql([7, 1, 3]);
        expect(ArrayHelper.diff([1, 2, 3, 4], [2, 4, 7])).to.eql([1, 3, 7]);
        expect(ArrayHelper.diff([1, 2, 2, 4], [2, 4, 4])).to.eql([1]);
    });

    it('exclude', ()=> {
        expect(ArrayHelper.exclude([2, 4], [1, 2, 3, 4])).to.eql([1, 3]);
        expect(ArrayHelper.exclude([1, 2, 3, 4], [4, 2])).to.eql([]);
        expect(ArrayHelper.exclude([1, 2], [4, 2, 4, 2])).to.eql([4, 4]);
    });

    it('intersect', ()=> {
        expect(ArrayHelper.intersect([1, 2, 3, 4, 5], [6, 3, 8, 2])).to.eql([2, 3]);
        expect(ArrayHelper.intersect([6, 3, 8, 2], [1, 2, 3, 4, 5])).to.eql([3, 2]);
        expect(ArrayHelper.intersect([2, 2, 1, 3], [3, 3, 2])).to.eql([2, 2, 3]);
    });

    it('unique', ()=> {
        expect(ArrayHelper.unique([1, 2, 1, 3, 2])).to.eql(['1', '2', '3']);
    });

    it('uniqueStrict', ()=> {
        expect(ArrayHelper.uniqueStrict([1, 2, 1, 3, 2])).to.eql([1, 2, 3]);
    });

    it('flip', ()=> {
        expect(ArrayHelper.flip([1, 2, 3])).to.eql({1: 0, 2: 1, 3: 2});
    });

    it('join', ()=> {
        expect(ArrayHelper.join([1, 2, 3])).to.eql('1, 2, 3');
        expect(ArrayHelper.join([1, 2, 3], '-')).to.eql('1-2-3');
        expect(ArrayHelper.join('1')).to.eql('1');
    });

    it('concat', ()=> {
        expect(ArrayHelper.concat([1, [2, 3], 4])).to.eql([1, 2, 3, 4]);
        expect(ArrayHelper.concat(3)).to.eql(3);
    });

    it('remove', ()=> {
        const items = [1, 2, 3, 4];
        expect(ArrayHelper.remove(3, items)).to.eql(true);
        expect(items).to.eql([1, 2, 4]);
        expect(ArrayHelper.remove(5, items)).to.eql(false);
    });

    it('getPropertyValues', ()=> {
        const items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 20}
        ];
        let res = ArrayHelper.getPropertyValues('val', items);
        expect(res).to.eql([10, 15, 20]);
    });

    it('searchByProperty', ()=> {
        const items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 20}
        ];
        const res = ArrayHelper.searchByProperty(15, 'val', items, 'id');
        expect(res).to.eql(2);
    });

    // RANDOM

    it('getRandom', ()=> {
        expect(ArrayHelper.getRandom([7, 8, 9])).to.be.within(7, 9);
    });

    it('shuffle', ()=> {
        const res = ArrayHelper.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        expect(res).to.lengthOf(9);
        expect(res).to.not.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('sortHierarchy', ()=> { // order children after parents
        const items = [{
            name: 'grandson',
            parent: 'son'
        },{
            name: 'mother',
            parent: 'grand'
        },{
            name: 'son',
            parent: 'father'
        },{
            name: 'father',
            parent: 'grand'
        },{
            name: 'grand'
        }];
        const res = ArrayHelper.sortHierarchy(items, 'name', 'parent');
        expect(res).to.eql([{
            name: 'grand'
        },{
            name: 'mother',
            parent: 'grand'
        },{
            name: 'father',
            parent: 'grand'
        },{
            name: 'son',
            parent: 'father'
        },{
            name: 'grandson',
            parent: 'son'
        }]);
    });
});