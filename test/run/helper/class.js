/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const ClassHelper = require('../../../helper/ClassHelper');
const Base = require('../../../base/Base');

class Test extends Base {}

describe('ClassHelper', ()=> {

    it('spawn', ()=> {
        let res = ClassHelper.spawn(Test, {test: 1});
        expect(res).to.be.an.instanceof(Test);
        expect(res.test).to.eql(1);

        res = ClassHelper.spawn({Class: Test, test: 1});
        expect(res).to.be.an.instanceof(Test);
        expect(res.test).to.eql(1);
    });

    it('normalizeSpawn', ()=> {
        let res = ClassHelper.normalizeSpawn(Test, {test: 1});
        expect(res).to.eql({Class: Test, test: 1});

        res = ClassHelper.normalizeSpawn({Class: Test}, {test: 1});
        expect(res).to.eql({Class: Test, test: 1});

        res = ClassHelper.normalizeSpawn({Class: Test, k1: 1, k2: 1}, {k1: 2}, {k1: 3, k2: 3, k3: 3});
        expect(res).to.eql({Class: Test, k1: 2, k2: 1, k3: 3});
    });

    it('defineClassProperty', ()=> {
        class Class {}
        ClassHelper.defineClassProperty(Class, 'test', 'value');
        const model = new Class;
        expect(Class.test).to.eql('value');
        expect(model.test).to.eql('value');
    });

    it('defineConstantClassProperties', ()=> {
        class Class extends Base {
            static getConstants () {
                return {KEY: 'value'};
            }
        }
        Class.init();
        const model = new Class;
        expect(Class.KEY).to.eql('value');
        expect(model.KEY).to.eql('value');
    });

    it('inheritConstantClassProperties', ()=> {
        class Parent extends Base {
            static getConstants () {
                return {
                    INHERIT: 'parent',
                    KEY: 'parent',
                    DATA: {p: 1},
                    EXTENDED: {p: 1}
                };
            }
        }
        Parent.init();

        class Child extends Parent {
            static getExtendedClassProperties () {
                return ['EXTENDED'];
            }
            static getConstants () {
                return {
                    KEY: 'child',
                    DATA: {c: 1},
                    EXTENDED: {c: 1}
                };
            }
        }
        Child.init();

        class Child2 extends Child {
            static getConstants () {
                return {
                    EXTENDED: {c2: 1}
                };
            }
        }
        Child2.init();

        expect(Parent.KEY).to.eql('parent');
        expect(Parent.DATA).to.eql({p: 1});
        expect(Parent.EXTENDED).to.eql({p: 1});

        expect(Child.INHERIT).to.eql('parent');
        expect(Child.KEY).to.eql('child');
        expect(Child.DATA).to.eql({c: 1});
        expect(Child.EXTENDED).to.eql({p: 1, c: 1});

        expect(Child2.INHERIT).to.eql('parent');
        expect(Child2.KEY).to.eql('child');
        expect(Child2.EXTENDED).to.eql({p: 1, c: 1, c2: 1});
    });
});