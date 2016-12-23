'use strict';

const crypto = require('crypto');

const HMAC_ALGO = 'sha1';
const HASH_LENGTH = 40;
const SALT_LENGTH = 8;
const SALT_MIN = Math.pow(10, SALT_LENGTH - 1);
const SALT_MAX = SALT_MIN * 10 - SALT_MIN - 1;

module.exports = class SecurityHelper {

    static createSalt () {
        return String(parseInt(Math.random() * SALT_MAX) + SALT_MIN);
    }

    static extractSalt (hash) {
        return hash.substring(HASH_LENGTH);
    }

    static validateHash (hash) {
        let s = `^[0-9a-f]{${HASH_LENGTH + SALT_LENGTH}`+'}$';
        return typeof hash === 'string' && (new RegExp(s)).test(hash);
    }

    static hashValue (value, salt) {
        return crypto.createHmac(HMAC_ALGO, salt).update(value).digest('hex') + salt;
    }

    static encryptPassword (password) {
        return !password ? '' : this.hashValue(password, this.createSalt());
    }

    static validatePassword (password, hash) {
        if (!password || !this.validateHash(hash)) {
            return false;
        }
        return this.hashValue(password, this.extractSalt(hash)) == hash;
    }

    static generateRandomString (length, cb) {
        crypto.randomBytes(length, (err, buf)=> {
            err ? cb(err) : cb(null, buf.toString('hex'));
        });
    }
};