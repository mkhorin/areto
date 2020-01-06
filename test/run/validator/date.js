/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Model = require('../../app/main/model/Model');
const Validator = require('areto/validator/DateValidator');

describe('DateValidator', ()=> {

    it('invalid date', async ()=> {
        const validator = new Validator;
        const model = new Model;
        model.set('attr', '1997-45-10');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('valid date', async ()=> {
        const validator = new Validator;
        const model = new Model;
        model.set('attr', new Date);
        await validator.validateAttr('attr', model);
        await expect(model.hasError()).to.false;
        model.set('attr', '2001-10-05');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
    });

    it('invalid min max', async ()=> {
        const model = new Model;
        const validator = new Validator({
            min: new Date('1996-11-05'),
            max: new Date('1998-05-11')
        });
        model.set('attr', '1996-02-20');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('valid min max', async ()=> {
        const model = new Model;
        const validator = new Validator({
            min: new Date('1996-11-05'),
            max: new Date('1998-05-11')
        });
        model.set('attr', '1997-02-20');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
    });
});