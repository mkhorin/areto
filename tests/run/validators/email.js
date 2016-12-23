'use strict';

let expect = require('chai').expect;
let Model = require('../../../models/Model');
const Validator = require('../../../validators/EmailValidator');
let validator = new Validator;

describe('validators.email', ()=> {

    it('invalid', ()=> {
        let model = new Model;
        model.set('attr', 'invalid-email');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.true;
        });
    });

    it('valid', ()=> {
        let model = new Model;
        model.set('attr', 'valid-email@com.com');
        validator.validateAttr(model, 'attr', ()=> {
            expect(model.hasError()).to.false;
        });
    });
});