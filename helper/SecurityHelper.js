'use strict';

const DEFAULT_HASH_ALGO = 'sha1';
const DEFAULT_HASH_LENGTH = 40;
const DEFAULT_SALT_LENGTH = 8;

module.exports = class SecurityHelper {

    static createSalt (length = DEFAULT_SALT_LENGTH) {
        let min = Math.pow(10, length - 1);
        return String(parseInt(Math.random() * (min * 9 - 1)) + min);
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

    static generateRandomString (length, cb) {
        if (isNaN(length)) {
            return cb('generateRandomString: Length must be a number');
        }
        crypto.randomBytes(length, (err, buf)=> {
            err ? cb(err) : cb(null, buf.toString('hex'));
        });
    }

    static hashFile (file, cb, algo = DEFAULT_HASH_ALGO) {
        fs.readFile(file, (err, data)=> {
            if (err) {
                return cb(err);
            }
            try {
                data = crypto.createHash(algo).update(data).digest('hex');
            } catch (err) {
                return cb(err);
            }
            cb(null, data);
        });
    }
};

const crypto = require('crypto');
const fs = require('fs');