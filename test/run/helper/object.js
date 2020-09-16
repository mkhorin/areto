/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const ObjectHelper = require('../../../helper/ObjectHelper');

describe('ObjectHelper', ()=> {

    it('push', ()=> {
        const res = {};
        ObjectHelper.push('value1', 'key', res);
        expect(res['key']).to.eql(['value1']);
        ObjectHelper.push('value2', 'key', res);
        expect(res['key']).to.eql(['value1', 'value2']);
    });

    it('getValue', ()=> {
        let res = ObjectHelper.getValue('key', undefined, 'def');
        expect(res).to.eql('def');
        res = ObjectHelper.getValue('key', {key: 5}, 'def');
        expect(res).to.eql(5);
        res = ObjectHelper.getValue('key2', {key: 5});
        expect(res).to.eql(undefined);
        res = ObjectHelper.getValue(['key1', 'key2'], {key1: 5}, 'def');
        expect(res).to.eql([5, 'def']);
    });

    it('getValueOrKey', ()=> {
        let res = ObjectHelper.getValueOrKey('key', {key: 5});
        expect(res).to.eql(5);
        res = ObjectHelper.getValueOrKey('key2', {key: 5});
        expect(res).to.eql('key2');
        res = ObjectHelper.getValueOrKey(['key1', 'key2'], {key1: 1, key2: 2});
        expect(res).to.eql([1, 2]);
    });

    it('getKeyByValue', ()=> {
        let res = ObjectHelper.getKeyByValue(5, {key: 5});
        expect(res).to.eql('key');
        res = ObjectHelper.getKeyByValue(7, {key: 5});
        expect(res).to.eql(undefined);
    });

    it('getKeysByValue', ()=> {
        const res = ObjectHelper.getKeysByValue(5, {
            k1: 5,
            k2: 3,
            k3: 5
        });
        expect(res).to.eql(['k1', 'k3']);
    });

    it('getAllPropertyNames', ()=> {
        class Test1 {
            test1 () {}
        }
        class Test2 extends Test1 {
            test2 () {}
        }
        class Test3 extends Test2 {
            test3 () {}
        }
        let list = ObjectHelper.getAllPropertyNames(new Test3);
        expect(list).to.include('test1');
        expect(list).to.include('test2');
        expect(list).to.include('test3');
    });

    it('getAllFunctionNames', ()=> {
        class Test1 {
            test1 () {}
        }
        class Test2 extends Test1 {
            test2 () {}
        }
        class Test3 extends Test2 {
            test3 () {}
        }
        let list = ObjectHelper.getAllFunctionNames(new Test3);
        expect(list).to.include('test1');
        expect(list).to.include('test2');
        expect(list).to.include('test3');
    });

    it('filterByKeys', ()=> {
        let res = {
            k1: 1,
            k2: 2,
            k3: 3,
            k4: 4
        };
        res = ObjectHelper.filterByKeys(['k2', 'k4'], res);
        expect(res).to.eql({
            k2: 2,
            k4: 4
        });
    });

    it('sortByKeys', ()=> {
        let res = {
            k4: 4,
            k1: 1,
            k5: 5,
            k2: 2,
            k3: 3
        };
        res = ObjectHelper.sortByKeys(['k1', 'k2', 'k3', 'k4', 'k5'], res);
        expect(res).to.eql({
            k1: 1,
            k2: 2,
            k3: 3,
            k4: 4,
            k5: 5
        });
    });

    it('hasCircularLinks', ()=> {
        const p1 = {}, p2 = {}, p3 = {};
        p1.parent = p2;
        p2.parent = p3;
        expect(ObjectHelper.hasCircularLinks(p1, 'parent')).to.eql(false);
        p3.parent = p1;
        expect(ObjectHelper.hasCircularLinks(p1, 'parent')).to.eql(true);
    });

    it('addKeyAsNestedValue', () => {
        let res = {
            k1: {},
            k2: {}
        };
        ObjectHelper.addKeyAsNestedValue('target', res);
        expect(res.k1['target']).to.eql('k1');
        expect(res.k2['target']).to.eql('k2');
    });

    it('replaceKeys', () => {
        let res = {
            o1: 1,
            o2: 2,
            o3: 3,
            o4: 4
        };
        let keys = {
            o1: 'n1',
            o2: 'n2',
            o3: 'o3',
            oNone: 'nNone'
        };
        ObjectHelper.replaceKeys(keys, res);
        expect(res).to.eql({
            n1: 1,
            n2: 2,
            o3: 3,
            o4: 4
        });
    });

    // DELETE PROPERTIES

    it('deleteEmptyProperties', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: undefined,
            k4: '',
            k5: []
        };
        ObjectHelper.deleteEmptyProperties(res);
        expect(res).to.eql({
            k1: 0,
            k5: []
        });
    });

    it('deleteEmptyArrayProperties', ()=> {
        let res = {
            k1: 0,
            k2: [],
            k3: [1, 2],
            k4: '',
            k5: {}
        };
        ObjectHelper.deleteEmptyArrayProperties(res);
        expect(res).to.eql({
            k1: 0,
            k3: [1, 2],
            k4: '',
            k5: {}
        });
    });

    it('deleteEmptyObjectProperties', ()=> {
        let res = {
            k1: {},
            k2: [],
            k3: [1, 2],
            k4: {},
            k5: {a: 1}
        };
        ObjectHelper.deleteEmptyObjectProperties(res);
        expect(res).to.eql({
            k2: [],
            k3: [1, 2],
            k5: {a: 1}
        });
    });

    it('deletePropertiesByValue', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: 55,
            k4: '4123',
            k5: 55
        };
        ObjectHelper.deletePropertiesByValue(55, res);
        expect(res).to.eql({
            k1: 0,
            k2: null,
            k4: '4123'
        });
        res = {
            k1: 0,
            k2: '23',
            k3: 55,
            k4: '23'
        };
        ObjectHelper.deletePropertiesByValue('23', res, ['k1', 'k2']);
        expect(res).to.eql({
            k1: 0,
            k3: 55,
            k4: '23'
        });
    });

    it('deleteProperties', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: 'test',
            k4: '',
            k5: []
        };
        ObjectHelper.deleteProperties(['k2', 'k4'], res);
        expect(res).to.eql({
            k1: 0,
            k3: 'test',
            k5: []
        });
    });

    it('deletePropertiesExcept', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: 'test',
            k4: '',
            k5: []
        };
        ObjectHelper.deletePropertiesExcept(['k2', 'k4'], res);
        expect(res).to.eql({
            k2: null,
            k4: ''
        });
    });

    it('expandArrayValues', ()=> {
        let data = {
            a1: 1
        };
        expect(ObjectHelper.expandArrayValues(data)).to.eql([{
            a1: 1
        }]);
        data = {
            a1: [1],
            a2: [2]
        };
        expect(ObjectHelper.expandArrayValues(data)).to.eql([{
            a1: 1,
            a2: 2,
        }]);
        data = {
            a1: 1,
            a2: [2, 3]
        };
        expect(ObjectHelper.expandArrayValues(data)).to.eql([{
            a1: 1,
            a2: 2,
        }, {
            a1: 1,
            a2: 3
        }]);
        data = {
            a1: [1, 2],
            a2: [3, 4]
        };
        expect(ObjectHelper.expandArrayValues(data)).to.eql([{
            a1: 1,
            a2: 3,
        }, {
            a1: 1,
            a2: 4
        }, {
            a1: 2,
            a2: 3,
        }, {
            a1: 2,
            a2: 4
        }]);
        expect(ObjectHelper.expandArrayValues(data, ['a2'])).to.eql([{
            a1: [1, 2],
            a2: 3,
        }, {
            a1: [1, 2],
            a2: 4
        }]);
        expect(ObjectHelper.expandArrayValues(null)).to.eql([]);
    });
});