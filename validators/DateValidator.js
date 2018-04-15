'use strict';

const Base = require('./Validator');

module.exports = class DateValidator extends Base {

    constructor (config) {
        super(Object.assign({
            min: null,
            max: null
        }, config));
    }

    init () {
        super.init();
        if (this.min !== null) {
            if (!(this.min instanceof Date)) {
                this.min = new Date(this.min);
            }
            if (!this.isValidDateObject(this.min)) {
                throw new Error(this.wrapClassMessage('Invalid min date'));
            }
        }
        if (this.max !== null) {
            if (!(this.max instanceof Date)) {
                this.max = new Date(this.max);
            }
            if (!this.isValidDateObject(this.max)) {
                throw new Error(this.wrapClassMessage('Invalid max date'));
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

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        value = value instanceof Date ? value : new Date(value);
        model.set(attr, value);        
        this.validateValue(value, (err, message)=> {
            message && this.addError(model, attr, message);
            cb(err);
        });
    }

    validateValue (value, cb) {
        value = value instanceof Date ? value : new Date(value);
        if (!this.isValidDateObject(value)) {            
            return cb(null, this.getMessage());
        }
        if (this.min !== null && value < this.min) {
            return cb(null, this.getTooSmallMessage());
        } 
        if (this.max !== null && value > this.max) {
            return cb(null, this.getTooBigMessage());
        }
        cb();
    }
};