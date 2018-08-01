'use strict';

let expect = require('chai').expect;
let Model = require('../../../models/Model');
const Validator = require('../../../validator/NumberValidator');
let validator = new Validator;

describe('validators.number', ()=> {

    it('invalid', ()=> {
        let model = new Model;
        model.set('attr', 'none');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.true;
        });
    });

    it('valid', ()=> {
        let model = new Model;
        model.set('attr', '3456.34');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.false;
        });
    });

    it('invalid integer only', ()=> {
        let model = new Model;
        model.set('attr', '3456.34');
        (new Validator({
            integerOnly: true
        })).validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.true;
        });
    });

    it('valid integer only', ()=> {
        let model = new Model;
        model.set('attr', '0456');
        (new Validator({
            integerOnly: true
        })).validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.false;
        });
    });

});