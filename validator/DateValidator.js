/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class DateValidator extends Base {

    constructor (config) {
        super({
            min: null,
            max: null,
            ...config
        });
        this.min = this.min && this.resolveDate(this.min);
        this.max = this.max && this.resolveDate(this.max);
    }

    resolveDate (src) {
        const date = src instanceof Date ? src : src === 'now' ? new Date : new Date(src);
        if (DateHelper.isValid(date)) {
            return date;
        }
        throw new Error(`Invalid date: ${src}`);
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid date');
    }

    getTooSmallMessage () {
        return this.createMessage(this.tooSmall, 'Date must be no less than {min}', {
            min: this.min.toISOString()
        });
    }

    getTooBigMessage () {
        return this.createMessage(this.tooBig, 'Date must be no greater than {max}', {
            max: this.max.toISOString()
        });
    }

    validateAttr (attr, model) {
        let value = model.get(attr);
        value = value instanceof Date ? value : new Date(value);
        model.set(attr, value);
        return super.validateAttr(...arguments);
    }

    validateValue (value) {
        if (!DateHelper.isValid(value)) {
            return this.getMessage();
        }
        if (this.min && value < this.min) {
            return this.getTooSmallMessage();
        } 
        if (this.max && value > this.max) {
            return this.getTooBigMessage();
        }
    }
};

const DateHelper = require('areto/helper/DateHelper');