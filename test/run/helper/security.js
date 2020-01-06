/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const {expect} = require('chai');
const SecurityHelper = require('../../../helper/SecurityHelper');

describe('SecurityHelper', ()=> {

    it('isHexString', ()=> {
        expect(SecurityHelper.isHexString('abcdef1234567890')).to.eql(true);
        expect(SecurityHelper.isHexString('A')).to.eql(false);
        expect(SecurityHelper.isHexString('m')).to.eql(false);
        expect(SecurityHelper.isHexString('')).to.eql(false);
    });

    it('getRandomString', async ()=> {
        const r1 = await SecurityHelper.getRandomString(8);
        const r2 = await SecurityHelper.getRandomString(8);
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
        const hash = SecurityHelper.hashPassword('1234567890');
        expect(SecurityHelper.checkPassword('1234567890', hash)).to.eql(true);
        expect(SecurityHelper.hashPassword('')).to.eql('');
        expect(SecurityHelper.hashPassword(null)).to.eql('');
        expect(SecurityHelper.hashPassword()).to.eql('');
    });

    it('hashValue', ()=> {
        const salt = SecurityHelper.createSalt();
        const hash = SecurityHelper.hashValue('1234567890', salt);
        expect(SecurityHelper.checkHash(hash)).to.eql(true);
    });

    it('hashFile', async ()=> {
        const hash1 = await SecurityHelper.hashFile(module.filename);
        const hash2 = await SecurityHelper.hashFile(module.filename);
        expect(SecurityHelper.isHexString(hash1)).to.eql(true);
        expect(hash1).to.eql(hash2);
    });

    it('checkHash', ()=> {
        const hash = 'e118f603cb920e058977c1069542751a69531cd162fb13f8ed48961f075a1ed43c00f3cb';
        expect(SecurityHelper.checkHash(hash)).to.eql(true);
        expect(SecurityHelper.checkHash('e118f')).to.eql(false);
    });

    it('checkPassword', ()=> {
        const password = 'password';
        const hash = SecurityHelper.hashPassword(password);
        const fakeHash = SecurityHelper.hashPassword('fakePassword');
        expect(SecurityHelper.checkPassword(password, hash)).to.eql(true);
        expect(SecurityHelper.checkPassword(password, fakeHash)).to.eql(false);
        expect(SecurityHelper.checkPassword(password)).to.eql(false);
        expect(SecurityHelper.checkPassword()).to.eql(false);
    });
});