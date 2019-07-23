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
        let res = ClassHelper.spawn(TestClass, {test: 'value'});
        expect(res).to.be.an.instanceof(TestClass);
        expect(res.test).to.eql('value');

        res = ClassHelper.spawn({
            Class: TestClass,
            test: 'value'
        });
        expect(res).to.be.an.instanceof(TestClass);
        expect(res.test).to.eql('value');
    });

    it('normalizeSpawn', ()=> {
        let res = ClassHelper.normalizeSpawn(TestClass, {test: 'value'});
        expect(res.Class).to.eql(TestClass);
        expect(res.test).to.eql('value');

        res = ClassHelper.normalizeSpawn({Class: TestClass}, {test: 'value'});
        expect(res.Class).to.eql(TestClass);
        expect(res.test).to.eql('value');
    });

    it('defineClassProp', ()=> {
        class TestClass {}
        ClassHelper.defineClassProp(TestClass, 'test', 'value');
        let test = new TestClass;
        expect(TestClass.test).to.eql('value');
        expect(test.test).to.eql('value');
    });
});