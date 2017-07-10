'use strict';

const expect = require('chai').expect;
const Model = require('../../apps/main/models/Model');
const Validator = require('areto/validators/DateValidator');
const validator = new Validator;

describe('validators.date', ()=> {

    it('invalid date', ()=> {
        let model = new Model;
        model.set('attr', '1997-45-10');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.true;
        });
    });

    it('valid date', ()=> {
        let model = new Model;
        model.set('attr', new Date);
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.false;
        });
        model.set('attr', '2001-10-05');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.false;
        });
    });

    it('invalid min max', ()=> {
        let model = new Model;
        let validator = new Validator({
            min: new Date('1996-11-05'),
            max: new Date('1998-05-11')
        });
        model.set('attr', '1996-02-20');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.true;
        });
    });

    it('valid min max', ()=> {
        let model = new Model;
        let validator = new Validator({
            min: new Date('1996-11-05'),
            max: new Date('1998-05-11')
        });
        model.set('attr', '1997-02-20');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.false;
        });
    });
});