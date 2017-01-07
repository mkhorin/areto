'use strict';

const expect = require('chai').expect;
const SecurityHelper = require('../../../helpers/SecurityHelper');

describe('helpers.security', ()=> {

    it('validatePassword', ()=> {
        let password = 'password';
        let hash = SecurityHelper.encryptPassword(password);
        let fakeHash = SecurityHelper.encryptPassword('fake');
        expect(SecurityHelper.validatePassword(password, hash)).to.true;
        expect(SecurityHelper.validatePassword(password, fakeHash)).to.false;
        expect(SecurityHelper.validatePassword(password)).to.false;
        expect(SecurityHelper.validatePassword()).to.false;
    });

    it('generateRandomString', ()=> {
        SecurityHelper.generateRandomString(8, (err1, res1)=> {
            SecurityHelper.generateRandomString(8, (err2, res2)=> {
                expect(err1).to.null;
                expect(err2).to.null;
                expect(res1).to.lengthOf(8);
                expect(res2).to.lengthOf(8);
                expect(res1).to.not.equal(res2);
            });
        });
    });
});
