'use strict';

const DEFAULT_HASH_ALGO = 'sha1';
const DEFAULT_HASH_LENGTH = 40;
const DEFAULT_SALT_LENGTH = 8;

module.exports = class SecurityHelper {

    static createSalt (length = DEFAULT_SALT_LENGTH) {
        let min = Math.pow(10, length - 1);
        return Math.floor(Math.random() * (min * 9 - 1) + min).toString();
    }

    static extractSalt (hash, length = DEFAULT_HASH_LENGTH) {
        return hash.substring(length);
    }

    static validateHash (hash, hashLength = DEFAULT_HASH_LENGTH, saltLength = DEFAULT_SALT_LENGTH) {
        let s = `^[0-9a-f]{${hashLength + saltLength}`+'}$';
        return typeof hash === 'string' ? (new RegExp(s)).test(hash) : false;
    }

    static hashValue (value, salt, algo = DEFAULT_HASH_ALGO) {
        return crypto.createHmac(algo, salt).update(value).digest('hex') + salt;
    }

    static encryptPassword (password) {
        return !password ? '' : this.hashValue(password, this.createSalt());
    }

    static validatePassword (password, hash) {
        if (!password || !this.validateHash(hash)) {
            return false;
        }
        return this.hashValue(password, this.extractSalt(hash)) === hash;
    }

    static generateRandomString (length) {
        if (isNaN(length)) {
            throw new Error('Length must be a number');
        }
        return crypto.randomBytes(length).toString('hex');
    }

    static hashFile (file, algo = DEFAULT_HASH_ALGO) {
        let data = fs.readFileSync(file);
        return crypto.createHash(algo).update(data).digest('hex');
    }
};

const crypto = require('crypto');
const fs = require('fs');