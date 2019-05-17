/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const expect = require('chai').expect;
const SecurityHelper = require('../../../helper/SecurityHelper');

describe('SecurityHelper', ()=> {

    it('isHexString', ()=> {
        expect(SecurityHelper.isHexString('abcdef1234567890')).to.eql(true);
        expect(SecurityHelper.isHexString('A')).to.eql(false);
        expect(SecurityHelper.isHexString('m')).to.eql(false);
        expect(SecurityHelper.isHexString('')).to.eql(false);
    });

    it('getRandomString', async ()=> {
        let r1 = await SecurityHelper.getRandomString(8);
        let r2 = await SecurityHelper.getRandomString(8);
        expect(r1).to.lengthOf(16);
        expect(SecurityHelper.isHexString(r1)).to.eql(true);
        expect(r2).to.lengthOf(16);
        expect(SecurityHelper.isHexString(r2)).to.eql(true);
        expect(r1).to.not.equal(r2);
    });

    it('createSalt', ()=> {
        expect(SecurityHelper.createSalt()).to.match(/^[a-f0-9]{8}$/);
        expect(SecurityHelper.createSalt(4)).to.match(/^[a-f0-9]{4}$/);
    });

    it('hashPassword', ()=> {
        let hash = SecurityHelper.hashPassword('1234567890');
        expect(SecurityHelper.validatePassword('1234567890', hash)).to.eql(true);
        expect(SecurityHelper.hashPassword('')).to.eql('');
        expect(SecurityHelper.hashPassword(null)).to.eql('');
        expect(SecurityHelper.hashPassword()).to.eql('');
    });

    it('hashValue', ()=> {
        let salt = SecurityHelper.createSalt();
        let hash = SecurityHelper.hashValue('1234567890', salt);
        expect(SecurityHelper.validateHash(hash)).to.eql(true);
    });

    it('hashFile', async ()=> {
        let hash1 = await SecurityHelper.hashFile(module.filename);
        let hash2 = await SecurityHelper.hashFile(module.filename);
        expect(SecurityHelper.isHexString(hash1)).to.eql(true);
        expect(hash1).to.eql(hash2);
    });

    it('validateHash', ()=> {
        let hash = 'e118f603cb920e058977c1069542751a69531cd162fb13f8ed48961f075a1ed43c00f3cb';
        expect(SecurityHelper.validateHash(hash)).to.eql(true);
        expect(SecurityHelper.validateHash('e118f')).to.eql(false);
    });

    it('validatePassword', ()=> {
        let password = 'password';
        let hash = SecurityHelper.hashPassword(password);
        let fakeHash = SecurityHelper.hashPassword('fakePassword');
        expect(SecurityHelper.validatePassword(password, hash)).to.eql(true);
        expect(SecurityHelper.validatePassword(password, fakeHash)).to.eql(false);
        expect(SecurityHelper.validatePassword(password)).to.eql(false);
        expect(SecurityHelper.validatePassword()).to.eql(false);
    });
});