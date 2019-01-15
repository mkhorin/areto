/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const Model = require('../../app/main/model/Model');
const Validator = require('areto/validator/DateValidator');
const validator = new Validator;

describe('DateValidator', ()=> {

    it('invalid date', async ()=> {
        let model = new Model;
        model.set('attr', '1997-45-10');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.true;
    });

    it('valid date', async ()=> {
        let model = new Model;
        model.set('attr', new Date);
        await validator.validateAttr(model, 'attr');
        await expect(model.hasError()).to.false;
        model.set('attr', '2001-10-05');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.false;
    });

    it('invalid min max', async ()=> {
        let model = new Model;
        let validator = new Validator({
            'min': new Date('1996-11-05'),
            'max': new Date('1998-05-11')
        });
        model.set('attr', '1996-02-20');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.true;
    });

    it('valid min max', async ()=> {
        let model = new Model;
        let validator = new Validator({
            'min': new Date('1996-11-05'),
            'max': new Date('1998-05-11')
        });
        model.set('attr', '1997-02-20');
        await validator.validateAttr(model, 'attr');
        expect(model.hasError()).to.false;
    });
});