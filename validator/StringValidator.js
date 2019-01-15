/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class StringValidator extends Base {

    constructor (config) {
        super({
            length: null,
            max: null,
            min: null,
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

    validateValue (value) {
        if (typeof value !== 'string') {
            return this.getMessage();
        }
        let length = value.length;
        if (this.min !== null && length < this.min) {
            return this.getTooShortMessage();
        }
        if (this.max !== null && length > this.max) {
            return this.getTooLongMessage();
        }
        if (this.length !== null && length !== this.length) {
            return this.getNotEqualMessage();
        }
    }
};