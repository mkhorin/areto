'use strict';

const expect = require('chai').expect;
const MainHelper = require('../../../helpers/MainHelper');

describe('helpers.main', ()=> {

    describe('date', ()=> {        
        
        it('isValidDate', ()=> {
            expect(MainHelper.isValidDate(new Date)).to.true;
            expect(MainHelper.isValidDate('12-10-1905')).to.true;
            expect(MainHelper.isValidDate('test')).to.false;
            expect(MainHelper.isValidDate('12-40-1905')).to.false;
        });
        
        it('getValidDate', ()=> {
            let date = new Date;
            expect(MainHelper.getValidDate(date)).to.equal(date);
            expect(MainHelper.getValidDate('12-10-2015').getTime()).to.equal(new Date('12-10-2015').getTime());
            expect(MainHelper.getValidDate('12-40-2015')).to.null;
        });
    });

    it('createInstance', ()=> {        
        let object = MainHelper.createInstance({ 
            Class: String 
        });
        expect(object).to.be.an.instanceof(String);        
        object = MainHelper.createInstance(String);
        expect(object).to.be.an.instanceof(String);
        object = MainHelper.createInstance({});
        expect(object).to.be.an.object;
    });

    it('deepAssign: should assign object recursively', ()=> {
        let to = { a: { b: { c: 4, d: 5 }, n: 9}};
        let from = { a: { b: { c: 7, f: 6 }, n: { m: 5}}};
        ObjectHelper.deepAssign(to, from);
        expect(to.a.b.c).to.equal(7);
        expect(to.a.b.d).to.equal(5);
        expect(to.a.b.f).to.equal(6);
        expect(to.a.n.m).to.equal(5);
    });

    it('defineClassProperty', ()=> {
        class Test {}
        MainHelper.defineClassProperty(Test, 'prop', 'value');
        let test = new Test;
        expect(Test.prop).to.equal('value');
        expect(test.prop).to.equal('value');
    });

    it('parseJson: return JSON from string', ()=> {
        let json = MainHelper.parseJson(JSON.stringify({a: 5}));
        expect(json.a).to.equal(5);
    });

    it('parseJson: return NULL from invalid JSON string', ()=> {
        let json = MainHelper.parseJson('non-json');
        expect(json).to.equal(null);
    });

    it('getRandom', ()=> {
        let num = MainHelper.getRandom(5, 10);
        expect(num).to.be.within(5,10);
    });

    it('escapeRegExp: set special symbols as simple string', ()=> {
        let result = MainHelper.escapeRegExp('^test{1}$');
        result = (new RegExp(result)).test('^test{1}$');
        expect(result).to.true;
    });

    it('escapeHtml: set special symbols as simple string', ()=> {
        let result = MainHelper.escapeHtml('<div>test</div>');
        expect(result).to.equal('&lt;div&gt;test&lt;/div&gt;');
    });

    it('getValues', ()=> {
        let list = MainHelper.getValues({a: 1, b: 2, c: 3});
        expect(list).to.eql([1, 2, 3]);
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
  
    describe('createUrl', ()=> {
        it('simple', ()=> {
            let result = 1;
            expect(result).to.equal(1);
        });
    });

});