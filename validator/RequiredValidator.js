/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RequiredValidator extends Base {

    /**
     * @param {Object} config
     * @param {boolean} config.skip - Skip validation
     */
    constructor (config) {
        super({
            requiredValue: null,
            strict: false,
            skip: false,
            trimming: true,
            ...config
        });
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

    validateValue (value) {
        if (this.skip) {
            return;
        }
        if (this.requiredValue === null) {
            value = typeof value === 'string' && this.trimming ? value.trim() : value;
            if (this.strict ? value !== null : !this.isEmptyValue(value)) {
               return;
            }
            return this.getMessage();
        }
        if (this.strict ? value === this.requiredValue : value == this.requiredValue) {
            return;
        }
        return this.getRequiredMessage();
    }
};