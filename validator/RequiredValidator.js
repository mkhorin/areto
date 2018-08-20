'use strict';

const Base = require('./Validator');

module.exports = class RequiredValidator extends Base {

    constructor (config) {
        super(Object.assign({
            requiredValue: null,
            strict: false,
            skip: false // skip validation
        }, config));

        this.skipOnEmpty = false;
    }

    getMessage () {
        return this.createMessage(this.message, 'Value cannot be blank');
    }

    getRequiredMessage () {
        return this.createMessage(this.message, 'Value must be "{requiredValue}"', {
            requiredValue: this.requiredValue
        });
    }

    validateValue (value, cb) {
        if (this.skip) {
            return cb();
        }
        if (this.requiredValue === null) {
            if (this.strict && value !== null || !this.strict 
                && !this.isEmptyValue(typeof value === 'string' ? value.trim() : value)) {
               return cb();
            }
            return cb(null, this.getMessage());
        } 
        if (!this.strict && value == this.requiredValue || this.strict && value === this.requiredValue) {
            return cb();
        }
        cb(null, this.getRequiredMessage());
    }
};