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

    it('getNestedValue', ()=> {
        let data = {
            k11: {
                k21: {
                    k31: 5
                }
            }
        };
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
        data = {
            k11: 'not object'
        };
        ObjectHelper.setNestedValue(5, 'k11.k21', data);
        res = ObjectHelper.getNestedValue('k11.k21', data);
        expect(res).to.eql(5);
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

    it('deleteEmptyProps', ()=> {
        let res = {
            'key1': 0,
            'key2': null,
            'key3': undefined,
            'key4': '',
            'key5': []
        };
        ObjectHelper.deleteEmptyProps(res);
        expect(res).to.eql({
            'key1': 0,
            'key5': []
        });
    });

    it('deleteProps', ()=> {
        let res = {
            'key1': 0,
            'key2': null,
            'key3': 'test',
            'key4': '',
            'key5': []
        };
        ObjectHelper.deleteProps(['key2', 'key4'], res);
        expect(res).to.eql({
            'key1': 0,
            'key3': 'test',
            'key5': []
        });
    });

    it('deletePropsExcept', ()=> {
        let res = {
            'key1': 0,
            'key2': null,
            'key3': 'test',
            'key4': '',
            'key5': []
        };
        ObjectHelper.deletePropsExcept(['key2', 'key4'], res);
        expect(res).to.eql({
            'key2': null,
            'key4': ''
        });
    });

    it('addKeyAsNestedValue', ()=> {
        let res = {key1: {}, key2: {}};
        ObjectHelper.addKeyAsNestedValue('nested', res);
        expect(res.key1['nested']).to.eql('key1');
        expect(res.key2['nested']).to.eql('key2');
    });
});