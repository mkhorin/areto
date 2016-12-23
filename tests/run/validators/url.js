'use strict';

let expect = require('chai').expect;
let Model = require('../../../models/Model');
const Validator = require('../../../validators/UrlValidator');
let validator = new Validator;

describe('validators.url', ()=> {

    it('invalid', ()=> {
        let model = new Model;
        model.set('url', 'http://noturl');
        validator.validateAttr(model, 'url', ()=> {
            expect(model.hasError()).to.true;
        });
    });

    it('valid', ()=> {
        let model = new Model;
        model.set('url', 'http://address.com/path.htm?params=[]');
        validator.validateAttr(model, 'url', ()=> {
            expect(model.hasError()).to.false;
        });
    });
});