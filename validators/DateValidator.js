'use strict';

const Base = require('./Validator');

module.exports = class DateValidator extends Base {

    constructor (config) {
        super(Object.assign({
            //pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/; // /^\d{4}-\d{2}-\d{2}$/,
            min: null,
            max: null
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid date');
        if (this.min !== null) {
            this.createMessage('tooSmall', 'Date must be no less than {min}');
            if (!(this.min instanceof Date)) {
                this.min = new Date(this.min);
            }
            if (!this.isValidDateObject(this.min)) {
                throw new Error('DateValidator: Invalid min date');
            }
        }
        if (this.max !== null) {
            this.createMessage('tooBig', 'Date must be no greater than {max}');
            if (!(this.max instanceof Date)) {
                this.max = new Date(this.max);
            }
            if (!this.isValidDateObject(this.max)) {
                throw new Error('DateValidator: Invalid max date');
            }
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
            return cb(null, this.tooSmall, {min: this.min});
        } 
        if (this.max !== null && value > this.max) {
            return cb(null, this.tooBig, {max: this.max});
        }
        cb();
    }
};