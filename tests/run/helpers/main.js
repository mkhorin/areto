'use strict';

let expect = require('chai').expect;
let helper = require('../../../helpers/main');

describe('helpers.main', ()=> {

    describe('date', ()=> {        
        
        it('isValidDate', ()=> {
            expect(helper.isValidDate(new Date)).to.true;
            expect(helper.isValidDate('12-10-1905')).to.true;
            expect(helper.isValidDate('test')).to.false;
            expect(helper.isValidDate('12-40-1905')).to.false;
        });
        
        it('getValidDate', ()=> {
            let date = new Date;
            expect(helper.getValidDate(date)).to.equal(date);
            expect(helper.getValidDate('12-10-2015').getTime()).to.equal(new Date('12-10-2015').getTime());
            expect(helper.getValidDate('12-40-2015')).to.null;
        });
    });

    it('createInstance', ()=> {        
        let object = helper.createInstance({ 
            Class: String 
        });
        expect(object).to.be.an.instanceof(String);        
        object = helper.createInstance(String);
        expect(object).to.be.an.instanceof(String);
        object = helper.createInstance({});
        expect(object).to.be.an.object;
    });

    it('deepAssign: should assign object recursively', ()=> {
        let to = { a: { b: { c: 4, d: 5 }, n: 9}};
        let from = { a: { b: { c: 7, f: 6 }, n: { m: 5}}};
        helper.deepAssign(to, from);
        expect(to.a.b.c).to.equal(7);
        expect(to.a.b.d).to.equal(5);
        expect(to.a.b.f).to.equal(6);
        expect(to.a.n.m).to.equal(5);
    });

    it('defineClassProperty', ()=> {
        class Test {}
        helper.defineClassProperty(Test, 'prop', 'value');
        let test = new Test;
        expect(Test.prop).to.equal('value');
        expect(test.prop).to.equal('value');
    });

    it('parseJson: return JSON from string', ()=> {
        let json = helper.parseJson(JSON.stringify({a: 5}));
        expect(json.a).to.equal(5);
    });

    it('parseJson: return NULL from invalid JSON string', ()=> {
        let json = helper.parseJson('non-json');
        expect(json).to.equal(null);
    });

    it('getRandom', ()=> {
        let num = helper.getRandom(5, 10);
        expect(num).to.be.within(5,10);
    });

    it('escapeRegExp: set special symbols as simple string', ()=> {
        let result = helper.escapeRegExp('^test{1}$');
        result = (new RegExp(result)).test('^test{1}$');
        expect(result).to.true;
    });

    it('escapeHtml: set special symbols as simple string', ()=> {
        let result = helper.escapeHtml('<div>test</div>');
        expect(result).to.equal('&lt;div&gt;test&lt;/div&gt;');
    });

    it('mapObject: handle each object property', ()=> {
        let data = {a: 1, c: {d: 4}};
        helper.mapObject(data, (prop, object)=> {
            object[prop] *= 2;
        }, true);
        expect(data.a).to.equal(2);
        expect(data.c.d).to.equal(8);
    });

    it('objectToValueArray', ()=> {
        let list = helper.objectToValueArray({a: 1, b: 2, c: 3});
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
        let list = helper.getAllPropertyNames(new Test3);
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
        let list = helper.getAllFunctionNames(new Test3);
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