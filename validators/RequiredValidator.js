'use strict';

const Base = require('./Validator');

module.exports = class RequiredValidator extends Base {

    constructor (config) {
        super(Object.assign({
            requiredValue: null,
            strict: false
        }, config));
    }

    init () {
        super.init();
        this.skipOnEmpty = false;
        this.createMessage('message', this.requiredValue === null 
            ? 'Value cannot be blank' : 'Value must be "{requiredValue}"');
    }

    validateValue (value, cb) {
        if (this.requiredValue === null) {
            if (this.strict && value !== null || !this.strict 
                && !this.isEmpty(typeof value === 'string' ? value.trim() : value)) {
               return cb();
            }
            return cb(null, this.message);
        } 
        if (!this.strict && value == this.requiredValue || this.strict && value === this.requiredValue) {
            return cb();
        }
        cb(null, this.message, { requiredValue: this.requiredValue });
    }
};