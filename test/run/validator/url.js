'use strict';

const expect = require('chai').expect;
const Model = require('../../app/main/model/Model');
const Validator = require('../../../validator/UrlValidator');
const validator = new Validator;

describe('UrlValidator', ()=> {

    it('invalid', async ()=> {
        let model = new Model;
        model.set('url', 'not-url');
        await validator.validateAttr(model, 'url');
        expect(model.hasError()).to.true;
    });

    it('valid', async ()=> {
        let model = new Model;
        model.set('url', 'http://address.com/path.htm?params=[]');
        await validator.validateAttr(model, 'url');
        expect(model.hasError()).to.false;
    });
});