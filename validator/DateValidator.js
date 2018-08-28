'use strict';

const Base = require('./Validator');

module.exports = class DateValidator extends Base {

    constructor (config) {
        super(Object.assign({
            min: null,
            max: null
        }, config));

        this.initDate('min');
        this.initDate('max');
    }

    initDate (key) {
        if (this[key] !== null) {
            if (!(this[key] instanceof Date)) {
                this[key] = new Date(this[key]);
            }
            if (!this.isValidDateObject(this[key])) {
                throw new Error(this.wrapClassMessage(`Invalid ${key} date`));
            }
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid date');
    }

    getTooSmallMessage () {
        return this.createMessage(this.tooSmall, 'Date must be no less than {min}', {
            min: this.min
        });
    }

    getTooBigMessage () {
        return this.createMessage(this.tooBig, 'Date must be no greater than {max}', {
            max: this.max
        });
    }

    isValidDateObject (date) {        
        return Object.prototype.toString.call(date) !== '[object Date]'
            ? false
            : !isNaN(date.getTime());
    }

    async validateAttr (model, attr) {
        let value = model.get(attr);
        value = value instanceof Date ? value : new Date(value);
        model.set(attr, value);
        let message = await this.validateValue(value);
        if (message) {
            this.addError(model, attr, message);
        }
    }

    async validateValue (value) {
        value = value instanceof Date ? value : new Date(value);
        if (!this.isValidDateObject(value)) {            
            return this.getMessage();
        }
        if (this.min !== null && value < this.min) {
            return this.getTooSmallMessage();
        } 
        if (this.max !== null && value > this.max) {
            return this.getTooBigMessage();
        }
    }
};