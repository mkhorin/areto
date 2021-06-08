/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class StringValidator extends Base {

    constructor (config) {
        super({
            length: null,
            max: null, // max length
            min: null, // min length
            pattern: null, // [RegExp]
            trimming: true, // remove whitespace from ends of a string
            shrinking: false, // replace multiple spaces with one
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Value must be a string');
    }

    getTooShortMessage () {
        return this.createMessage(this.tooShort, 'Value should contain at least {min} chr.', {
            min: this.min
        });
    }

    getTooLongMessage () {
        return this.createMessage(this.tooLong, 'Value should contain at most {max} chr.', {
            max: this.max
        });
    }

    getNotEqualMessage () {
        return this.createMessage(this.notEqual, 'Value should contain {length} chr.', {
            length: this.length
        });
    }

    getNotMatchMessage () {
        return this.createMessage(this.notMatch, 'Value does not match pattern');
    }

    validateAttr (attr, model) {
        let value = model.get(attr);
        if (typeof value === 'string') {
            if (this.trimming) {
                value = value.trim();
            }
            if (this.shrinking) {
                value = value.replace(/(\s)+/g, '$1');
            }
            model.set(attr, value);
        }
        return super.validateAttr(attr, model);
    }

    validateValue (value) {
        if (typeof value !== 'string') {
            return this.getMessage();
        }
        const length = value.length;
        if (this.min !== null && length < this.min) {
            return this.getTooShortMessage();
        }
        if (this.max !== null && length > this.max) {
            return this.getTooLongMessage();
        }
        if (this.length !== null && length !== this.length) {
            return this.getNotEqualMessage();
        }
        if (this.pattern instanceof RegExp && !this.pattern.test(value)) {
            return this.getNotMatchMessage();
        }
    }
};