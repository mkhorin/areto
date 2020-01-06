/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Model = require('../../app/main/model/Model');
const Validator = require('areto/validator/BooleanValidator');

describe('BooleanValidator', ()=> {

    it('default', async ()=> {
        const model = new Model;
        const validator = new Validator;

        model.set('attr', true);
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);

        model.set('attr', false);
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);

        model.set('attr', 'not boolean');
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('strict', async ()=> {
        const model = new Model;
        const validator = new Validator({strict: true});

        model.set('attr', 0);
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);

        model.set('attr', 1);
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(true);
    });

    it('cast', async ()=> {
        const model = new Model;
        const validator = new Validator;

        model.set('attr', 0);
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
        expect(model.get('attr')).to.eql(false);

        model.set('attr', 1);
        await validator.validateAttr('attr', model);
        expect(model.hasError()).to.eql(false);
        expect(model.get('attr')).to.eql(true);
    });
});