/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const IndexHelper = require('../../../helper/IndexHelper');

describe('IndexHelper', ()=> {

    it('indexObjects', ()=> {
        const items = [
            {id: 0, k1: 11, k2: 101},
            {id: 1, k1: 11, k2: 101},
            {id: 2, k1: 11, k2: 102},
            {id: 3, k1: 12, k2: 102},
            {id: 4, k1: 12, k2: 103},
            {id: 5, k1: 12, k2: 103}
        ];
        let res = IndexHelper.indexObjects(items, 'id');
        expect(res).to.eql({
            0: items[0],
            1: items[1],
            2: items[2],
            3: items[3],
            4: items[4],
            5: items[5]
        });
        res = IndexHelper.indexObjects(items, 'k1');
        expect(res).to.eql({
            11: items[2],
            12: items[5]
        });
        res = IndexHelper.indexObjects(items, 'k1', 'id');
        expect(res).to.eql({
            11: 2,
            12: 5
        });
        res = IndexHelper.indexObjects(items, ['k1', 'k2']);
        expect(res).to.eql({
            11: {
                101: items[1],
                102: items[2]
            },
            12: {
                102: items[3],
                103: items[5]
            }
        });
    });

    it('indexObjectsByArrayKey', ()=> {
        const items = [
            {id: 0, k1: 11},
            {id: 1, k1: [11, 12]},
            {id: 2, k1: 12},
            {id: 3, k1: [12, 13]}
        ];
        let res = IndexHelper.indexObjects(items, 'k1');
        expect(res).to.eql({
            11: items[1],
            12: items[3],
            13: items[3]
        });
    });

    it('indexObjectArrays', ()=> {
        const items = [
            {id: 0, k1: 11, k2: 101},
            {id: 1, k1: 11, k2: 101},
            {id: 2, k1: 11, k2: 102},
            {id: 3, k1: 12, k2: 102},
            {id: 4, k1: 12, k2: 103},
            {id: 5, k1: 12, k2: 103}
        ];
        let res = IndexHelper.indexObjectArrays(items, 'k1');
        expect(res).to.eql({
            11: [items[0], items[1], items[2]],
            12: [items[3], items[4], items[5]]
        });
        res = IndexHelper.indexObjectArrays(items, 'k2', 'id');
        expect(res).to.eql({
            101: [0, 1],
            102: [2, 3],
            103: [4, 5]
        });
        res = IndexHelper.indexObjectArrays(items, ['k1', 'k2']);
        expect(res).to.eql({
            11: {
                101: [items[0], items[1]],
                102: [items[2]]
            },
            12: {
                102: [items[3]],
                103: [items[4], items[5]]
            }
        });
    });

    it('indexObjectArraysByArrayKey', () => {
        const items = [
            {id: 0, k1: 11},
            {id: 1, k1: [11, 12]},
            {id: 2, k1: 12},
            {id: 3, k1: [12, 13]}
        ];
        let res = IndexHelper.indexObjectArrays(items, 'k1');
        expect(res).to.eql({
            11: [items[0], items[1]],
            12: [items[1], items[2], items[3]],
            13: [items[3]]
        });
    });
});