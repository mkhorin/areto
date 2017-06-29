'use strict';

let expect = require('chai').expect;
const MainHelper = require('../../../helpers/init');

describe('helpers.init', ()=> {

    describe('Array', ()=> {

        it('diff', ()=> {
            expect([1, 2, 3, 4, 5].diff([2, 4])).to.eql([1, 3, 5]);
        });

        it('flip', ()=> {
            expect([1, 2, 3].flip()).to.eql({1: null, 2: null, 3: null});
        });

        it('getRandom', ()=> {
            expect([7, 8, 9].getRandom()).to.be.within(7, 9);
        });

        it('shuffle', ()=> {
            let list = [1, 2, 3, 4, 5, 6, 7, 8, 9].shuffle();
            expect(list).to.lengthOf(9);
            expect(list).to.not.eql([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        });

        it('intersect', ()=> {
            let list = [1, 2, 3, 4, 5].intersect([6, 3, 8, 2]);
            expect(list).to.eql([2, 3]);
        });

        it('unique', ()=> {
            expect([1, 2, 1, 3, 2].unique()).to.eql([1, 2, 3]);
        });

        it('getObjectKeyValue', ()=> {
            let list = [{id: 1, val: 10}, {id: 2, val: 15}, {id: 3, val: 20}];
            let result = list.getObjectKeyValue('val', 15, 'id');
            expect(result).to.equal(2);
        });
    });

    describe('RegExp', ()=> {

        it('toJSON', ()=> {
            // default - JSON.stringify(new RegExp) = {}
            expect(JSON.stringify(new RegExp('^test$'))).to.equal('"/^test$/"');
        });
    });
});