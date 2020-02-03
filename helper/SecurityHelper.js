/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const DEFAULT_HASH_METHOD = 'sha256';
const DEFAULT_HASH_LENGTH = 64;
const DEFAULT_SALT_LENGTH = 8;
const HEX_REGEX = /^[a-f0-9]+$/;

module.exports = class SecurityHelper {

    static isHexString (data) {
        return HEX_REGEX.test(data)
    }

    static getRandomString (length) {
        if (isNaN(length)) {
            throw new Error('Length must be a number');
        }
        return crypto.randomBytes(length).toString('hex');
    }

    static createSalt (length = DEFAULT_SALT_LENGTH) {
        if (length % 2) {
            throw new Error('length must be a multiple of 2');
        }
        return crypto.randomBytes(length / 2).toString('hex');
    }

    static extractSalt (hash, length = DEFAULT_HASH_LENGTH) {
        return hash.substring(length);
    }

    static hashPassword (password) {
        return !password ? '' : this.hashValue(password, this.createSalt());
    }

    static hashValue (value, salt, method = DEFAULT_HASH_METHOD) {
        return crypto.createHmac(method, salt).update(value).digest('hex') + salt;
    }

    static async hashFile (file, method = DEFAULT_HASH_METHOD) {
        const data = await fs.promises.readFile(file);
        return crypto.createHash(method).update(data).digest('hex');
    }

    static checkHash (hash, hashLength = DEFAULT_HASH_LENGTH, saltLength = DEFAULT_SALT_LENGTH) {
        return typeof hash === 'string'
            && hash.length === hashLength + saltLength
            && this.isHexString(hash);
    }

    static checkPassword (password, hash) {
        if (typeof password !== 'string' || !password || !this.checkHash(hash)) {
            return false;
        }
        return this.hashValue(password, this.extractSalt(hash)) === hash;
    }
};

const crypto = require('crypto');
const fs = require('fs');