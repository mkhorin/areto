/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const ObjectHelper = require('../../../helper/ObjectHelper');

describe('ObjectHelper', ()=> {

    it('push', ()=> {
        let res = {};
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
    });

    it('getValueOrKey', ()=> {
        let res = ObjectHelper.getValueOrKey('key', {key: 5});
        expect(res).to.eql(5);
        res = ObjectHelper.getValueOrKey('key2', {key: 5});
        expect(res).to.eql('key2');
    });

    it('getKeyByValue', ()=> {
        let res = ObjectHelper.getKeyByValue(5, {key: 5});
        expect(res).to.eql('key');
        res = ObjectHelper.getKeyByValue(7, {key: 5});
        expect(res).to.eql(undefined);
    });

    it('getKeysByValue', ()=> {
        let res = ObjectHelper.getKeysByValue(5, {
            k1: 5,
            k2: 3,
            k3: 5
        });
        expect(res).to.eql(['k1', 'k3']);
    });

    it('getAllPropNames', ()=> {
        class Test1 {
            test1 () {}
        }
        class Test2 extends Test1 {
            test2 () {}
        }
        class Test3 extends Test2 {
            test3 () {}
        }
        let list = ObjectHelper.getAllPropNames(new Test3);
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

    // DELETE PROPS

    it('deleteEmptyProps', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: undefined,
            k4: '',
            k5: []
        };
        ObjectHelper.deleteEmptyProps(res);
        expect(res).to.eql({
            k1: 0,
            k5: []
        });
    });

    it('deletePropsByValue', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: 55,
            k4: '4123',
            k5: 55
        };
        ObjectHelper.deletePropsByValue(55, res);
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
        ObjectHelper.deletePropsByValue('23', res, ['k1', 'k2']);
        expect(res).to.eql({
            k1: 0,
            k3: 55,
            k4: '23'
        });
    });

    it('deleteProps', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: 'test',
            k4: '',
            k5: []
        };
        ObjectHelper.deleteProps(['k2', 'k4'], res);
        expect(res).to.eql({
            k1: 0,
            k3: 'test',
            k5: []
        });
    });

    it('deletePropsExcept', ()=> {
        let res = {
            k1: 0,
            k2: null,
            k3: 'test',
            k4: '',
            k5: []
        };
        ObjectHelper.deletePropsExcept(['k2', 'k4'], res);
        expect(res).to.eql({
            k2: null,
            k4: ''
        });
    });

    // NESTED VALUE

    it('getNestedValue', ()=> {
        let data = {k11: {k21: {k31: 5}}};
        let res = ObjectHelper.getNestedValue('k11.k21.k31', data);
        expect(res).to.eql(5);
        res = ObjectHelper.getNestedValue('k11.k21.none', data, 'def');
        expect(res).to.eql('def');
    });

    it('setNestedValue', ()=> {
        let data = {};
        ObjectHelper.setNestedValue(5, 'k11.k21.k31', data);
        let res = ObjectHelper.getNestedValue('k11.k21.k31', data);
        expect(res).to.eql(5);
        data = {k11: 'not object'};
        ObjectHelper.setNestedValue(5, 'k11.k21', data);
        res = ObjectHelper.getNestedValue('k11.k21', data);
        expect(res).to.eql(5);
    });

    it('addKeyAsNestedValue', ()=> {
        let res = {k1: {}, k2: {}};
        ObjectHelper.addKeyAsNestedValue('nested', res);
        expect(res.k1['nested']).to.eql('k1');
        expect(res.k2['nested']).to.eql('k2');
    });
});