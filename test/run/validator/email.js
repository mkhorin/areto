/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const Model = require('../../app/main/model/Model');
const Validator = require('../../../validator/EmailValidator');
const validator = new Validator;

describe('EmailValidator', ()=> {

    it('invalid', async ()=> {
        const model = new Model;
        model.set('attr', 'invalid-email');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);

        model.set('attr', 'invalid@email');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('valid', async ()=> {
        const model = new Model;
        model.set('attr', 'valid-email@mail.com');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
    });
});