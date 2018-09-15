/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const expect = require('chai').expect;
const Model = require('../../app/main/model/Model');
const Validator = require('../../../validator/EmailValidator');
const validator = new Validator;

describe('EmailValidator', ()=> {

    it('invalid', async ()=> {
        let model = new Model;
        model.set('attr', 'invalid-email');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.true;
    });

    it('valid', async ()=> {
        let model = new Model;
        model.set('attr', 'valid-email@com.com');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.false;
    });
});