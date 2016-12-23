'use strict';

let expect = require('chai').expect;
const helper = require('../../../helpers/SecurityHelper');

describe('helpers.security', ()=> {

    it('validatePassword', ()=> {
        let password = 'password';
        let hash = helper.encryptPassword(password);
        let fakeHash = helper.encryptPassword('fake');
        expect(helper.validatePassword(password, hash)).to.true;
        expect(helper.validatePassword(password, fakeHash)).to.false;
        expect(helper.validatePassword(password)).to.false;
        expect(helper.validatePassword()).to.false;
    });

    it('generateRandomString', ()=> {
        helper.generateRandomString(8, (err1, res1)=> {
            helper.generateRandomString(8, (err2, res2)=> {
                expect(err1).to.null;
                expect(err2).to.null;
                expect(res1).to.lengthOf(8);
                expect(res2).to.lengthOf(8);
                expect(res1).to.not.equal(res2);
            });
        });
    });
});
