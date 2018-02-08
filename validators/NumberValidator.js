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

    getMessage () {
        return this.createMessage(this.message, 'Value must be a number');
    }

    getNotIntegerMessage () {
        return this.createMessage(this.message, 'Number must be a integer');
    }

    getTooSmallMessage () {
        return this.createMessage(this.tooSmall, 'Value must be no less than {min}', {
            min: this.min
        });
    }

    getTooBigMessage () {
        return this.createMessage(this.tooBig, 'Value must be no greater than {max}', {
            max: this.max
        });
    }

    validateAttr (model, attr, cb) {
        super.validateAttr(model, attr, err => {
            if (err) {
                return cb(err);
            }
            if (!model.hasError()) {
                model.set(attr, Number(model.get(attr)));
            }
            cb();
        });
    }

    validateValue (value, cb) {
        value = Number(value);
        if (isNaN(Number(value))) {
            return cb(null, this.getMessage());
        }
        if (this.integerOnly && value !== parseInt(value)) {
            return cb(null, this.getNotIntegerMessage());
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