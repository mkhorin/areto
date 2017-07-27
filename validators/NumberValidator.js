'use strict';

const Base = require('./Validator');

module.exports = class NumberValidator extends Base {

    constructor (config) {
        super(Object.assign({
            integerOnly: false,
            max: null,
            min: null
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', this.integerOnly ? 'Number must be a integer' : 'Value must be a number');
        if (this.min !== null) {
            this.createMessage('tooSmall', 'Value must be no less than {min}', {min: this.min});
        }
        if (this.max !== null) {
            this.createMessage('tooBig', 'Value must be no greater than {max}', {max: this.max});
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        this.validateValue(value, (err, msg, params)=> {
            if (err) {
                return cb(err);
            }
            msg ? this.addError(model, attr, msg, params)
                : model.set(attr, Number(value));
            cb();
        });
    }

    validateValue (value, cb) {
        if (isNaN(Number(value))) {
            return cb(null, this.message);
        }
        value = Number(value);
        if (this.min !== null && value < this.min) {
            return cb(null, this.tooSmall);
        } 
        if (this.max !== null && value > this.max) {
            return cb(null, this.tooBig);
        }
        cb();
    }
};

const async = require('async');