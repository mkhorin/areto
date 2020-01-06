/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const Model = require('../../app/main/model/Model');
const Validator = require('../../../validator/UrlValidator');
const validator = new Validator;

describe('UrlValidator', ()=> {

    it('invalid', async ()=> {
        const model = new Model;
        model.set('url', 'not-url');
        await validator.validateAttr('url', model);
        expect(model.hasError()).to.eql(true);
    });

    it('valid', async ()=> {
        const model = new Model;
        model.set('url', 'http://address.com/path.htm?params=[]');
        await validator.validateAttr('url', model);
        expect(model.hasError()).to.eql(false);
    });
});