/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const DEFAULT_HASH_ALGO = 'sha256';
const DEFAULT_HASH_LENGTH = 64;
const DEFAULT_SALT_LENGTH = 8;

module.exports = class SecurityHelper {

    static createSalt (length = DEFAULT_SALT_LENGTH) {
        if (length % 2) {
            throw new Error('length must be a multiple of 2');
        }
        return crypto.randomBytes(length / 2).toString('hex');
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

    static hashFile (file, algo = DEFAULT_HASH_ALGO) {
        let data = fs.readFileSync(file);
        return crypto.createHash(algo).update(data).digest('hex');
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
};

const crypto = require('crypto');
const fs = require('fs');