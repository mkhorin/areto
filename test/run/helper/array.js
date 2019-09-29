/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const ArrayHelper = require('../../../helper/ArrayHelper');

describe('ArrayHelper', ()=> {

    it('diff', ()=> {
        const res = ArrayHelper.diff([1, 2, 3, 4, 5], [2, 4]);
        expect(res).to.eql([1, 3, 5]);
    });

    it('intersect', ()=> {
        const res = ArrayHelper.intersect([1, 2, 3, 4, 5], [6, 3, 8, 2]);
        expect(res).to.eql([2, 3]);
    });

    it('unique', ()=> {
        const res = ArrayHelper.unique([1, 2, 1, 3, 2]);
        expect(res).to.eql(['1', '2', '3']);
    });

    it('uniqueStrict', ()=> {
        const res = ArrayHelper.uniqueStrict([1, 2, 1, 3, 2]);
        expect(res).to.eql([1, 2, 3]);
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

    it('removeValue', ()=> {
        const items = [1, 2, 3, 4];
        expect(ArrayHelper.removeValue(3, items)).to.eql(true);
        expect(items).to.eql([1, 2, 4]);
        expect(ArrayHelper.removeValue(5, items)).to.eql(false);
    });

    it('getPropertyValues', ()=> {
        const items = [
            {id: 1, val: 10},
            {id: 2, val: 15},
            {id: 3, val: 20}
        ];
        let res = ArrayHelper.getPropertyValues(items, 'val');
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
        const res = ArrayHelper.getRandom([7, 8, 9]);
        expect(res).to.be.within(7, 9);
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