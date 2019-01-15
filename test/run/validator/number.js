/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const Model = require('../../app/main/model/Model');
const Validator = require('../../../validator/NumberValidator');
const validator = new Validator;

describe('NumberValidator', ()=> {

    it('invalid', async ()=> {
        let model = new Model;
        model.set('attr', 'none');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.true;
    });

    it('valid', async ()=> {
        let model = new Model;
        model.set('attr', '3456.34');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.false;
    });

    it('invalid integer only', async ()=> {
        let model = new Model;
        model.set('attr', '3456.34');
        await (new Validator({
            integerOnly: true
        })).validateAttr(model, 'attr');
        expect(model.hasError()).to.true;
    });

    it('valid integer only', async ()=> {
        let model = new Model;
        model.set('attr', '0456');
        await (new Validator({
            integerOnly: true
        })).validateAttr(model, 'attr');
        expect(model.hasError()).to.false;
    });

});