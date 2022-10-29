/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Model = require('../../app/main/model/Model');
const Validator = require('../../../validator/NumberValidator');
const validator = new Validator;

describe('NumberValidator', ()=> {

    it('invalid', async ()=> {
        const model = new Model;
        model.set('attr', 'none');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('valid', async ()=> {
        const model = new Model;
        model.set('attr', '3456.34');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
        model.set('attr', '0123.450');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
    });

    it('invalid integer only', async ()=> {
        const model = new Model;
        model.set('attr', '3456.34');
        const validator = new Validator({integerOnly: true});
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('valid integer only', async ()=> {
        const model = new Model;
        model.set('attr', '456');
        const validator = new Validator({integerOnly: true});
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
    });
});