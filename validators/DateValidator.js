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
        this.createMessage('message', 'Invalid date');
        if (this.min !== null) {
            if (!(this.min instanceof Date)) {
                this.min = new Date(this.min);
            }
            if (!this.isValidDateObject(this.min)) {
                throw new Error(`${this.constructor.name}: Invalid min date`);
            }
            this.createMessage('tooSmall', 'Date must be no less than {min}', {min: this.min});
        }
        if (this.max !== null) {
            if (!(this.max instanceof Date)) {
                this.max = new Date(this.max);
            }
            if (!this.isValidDateObject(this.max)) {
                throw new Error(`${this.constructor.name}: Invalid max date`);
            }
            this.createMessage('tooBig', 'Date must be no greater than {max}', {max: this.max});
        }
    }

    isValidDateObject (date) {        
        return Object.prototype.toString.call(date) !== '[object Date]' ? false : !isNaN(date.getTime());
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        value = value instanceof Date ? value : new Date(value);
        model.set(attr, value);        
        this.validateValue(value, (err, message, params)=> {
            message && this.addError(model, attr, message, params);
            cb(err);
        });
    }

    validateValue (value, cb) {
        value = value instanceof Date ? value : new Date(value);
        if (!this.isValidDateObject(value)) {            
            return cb(null, this.message);
        }
        if (this.min !== null && value < this.min) {
            return cb(null, this.tooSmall);
        } 
        if (this.max !== null && value > this.max) {
            return cb(null, this.tooBig);
        }
        cb();
    }
};