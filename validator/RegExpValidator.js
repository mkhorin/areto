/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RegExpValidator extends Base {

    static getConstants () {
        return {
            PATTERNS: {
            }
        };
    }

    constructor (config) {
        super({
            'pattern': null,
            'not': false, // not match pattern
            ...config
        });

        if (!this.pattern) {
            throw new Error(this.wrapClassMessage('Not set pattern'));
        }
        if (typeof this.pattern === 'string') {
            if (!Object.prototype.hasOwnProperty.call(this.PATTERNS, this.pattern)) {
                throw new Error(this.wrapClassMessage(`Not found built-in pattern: ${this.pattern}`));
            }
            this.pattern = this.PATTERNS[this.pattern];
        } else if (!(this.pattern instanceof RegExp)) {
            throw new Error(this.wrapClassMessage(`Invalid pattern: ${this.pattern}`));
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid value');
    }

    validateValue (value) {
        let valid = true;
        if (typeof value !== 'string') {
            valid = false;
        } else if (this.pattern.test(value)) {
            valid = !this.not;
        } else {
            valid = !!this.not;
        }
        return valid ? null : this.getMessage();
    }
};
module.exports.init();