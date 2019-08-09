/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const ClassHelper = require('../../../helper/ClassHelper');
const Base = require('../../../base/Base');

class TestClass extends Base {}

describe('ClassHelper', ()=> {

    it('spawn', ()=> {
        let res = ClassHelper.spawn(TestClass, {test: 1});
        expect(res).to.be.an.instanceof(TestClass);
        expect(res.test).to.eql(1);

        res = ClassHelper.spawn({Class: TestClass, test: 1});
        expect(res).to.be.an.instanceof(TestClass);
        expect(res.test).to.eql(1);
    });

    it('normalizeSpawn', ()=> {
        let res = ClassHelper.normalizeSpawn(TestClass, {test: 1});
        expect(res.Class).to.eql(TestClass);
        expect(res.test).to.eql(1);

        res = ClassHelper.normalizeSpawn({Class: TestClass}, {test: 1});
        expect(res.Class).to.eql(TestClass);
        expect(res.test).to.eql(1);

        res = ClassHelper.normalizeSpawn({Class: TestClass, k1: 1, k2: 1}, {k1: 2}, {k1: 3, k2: 3, k3: 3});
        expect(res).to.eql({Class: TestClass, k1: 2, k2: 1, k3: 3});
    });

    it('defineClassProp', ()=> {
        class TestClass {}
        ClassHelper.defineClassProp(TestClass, 'test', 'value');
        let test = new TestClass;
        expect(TestClass.test).to.eql('value');
        expect(test.test).to.eql('value');
    });
});