/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const SecurityHelper = require('../../../helper/SecurityHelper');

describe('SecurityHelper', ()=> {

    it('validatePassword', ()=> {
        let password = 'password';
        let hash = SecurityHelper.encryptPassword(password);
        let fakeHash = SecurityHelper.encryptPassword('fake');
        expect(SecurityHelper.validatePassword(password, hash)).to.true;
        expect(SecurityHelper.validatePassword(password, fakeHash)).to.false;
        expect(SecurityHelper.validatePassword(password)).to.false;
        expect(SecurityHelper.validatePassword()).to.false;
    });

    it('generateRandomString', async ()=> {
        let res1 = await SecurityHelper.generateRandomString(8);
        let res2 = await SecurityHelper.generateRandomString(8);
        expect(res1).to.lengthOf(16); // hex string
        expect(res2).to.lengthOf(16);
        expect(res1).to.not.equal(res2);
    });
});
