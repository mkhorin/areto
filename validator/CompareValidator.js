/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class CompareValidator extends Base {

    constructor (config) {
        super({
            compareAttr: null,
            compareValue: null,
            type: 'string',
            operator: '==',
            ...config
        });
    }

    getMessage (params) {
        let message;
        switch (this.operator) {
            case '==': message = 'Value must be repeated exactly'; break;
            case '===': message = 'Value must be repeated exactly'; break;
            case '!=': message = 'Value must not be equal to "{compareValue}"'; break;
            case '!==': message = 'Value must not be equal to "{compareValue}"'; break;
            case '>': message = 'Value must be greater than "{compareValue}"';break;
            case '>=': message = 'Value must be greater than or equal to "{compareValue}"'; break;
            case '<': message = 'Value must be less than "{compareValue}"'; break;
            case '<=': message = 'Value must be less than or equal to "{compareValue}"'; break;
            default: message = `Unknown operator: ${this.operator}`;
        }
        return this.createMessage(this.message, message, params);
    }

    getInvalidValueMessage () {
        return this.createMessage(this.invalidValue, 'Invalid value');
    }

    validateAttr (model, attr) {
        let value = model.get(attr), compareAttr, compareValue;
        if (value instanceof Array) {
            this.addError(model, attr, this.getInvalidValueMessage());
        } else if (this.compareValue !== null) {
            compareAttr = compareValue = this.compareValue;
        } else {
            compareValue = model.get(this.compareAttr);
            compareAttr = model.getAttrLabel(this.compareAttr);
        }
        if (!this.compareValues(this.operator, this.type, value, compareValue)) {
            this.addError(model, attr, this.getMessage({compareAttr, compareValue}));
        }
    }

    validateValue (value) {
        if (this.compareValue === null) {
            throw new Error('Value must be set');
        }
        if (this.compareValues(this.operator, this.type, value, this.compareValue)) {
            return this.getMessage({
                compareAttr: this.compareAttr,
                compareValue: this.compareValue
            });
        }
    }

    compareValues (operator, type, value, compareValue) {
        if (type === 'number') {
            value = Number(value);
            compareValue = Number(compareValue);
        } else {
            value = String(value);
            compareValue = String(compareValue);
        }
        switch (operator) {
            case '==': return value == compareValue;
            case '===': return value === compareValue;
            case '!=': return value != compareValue;
            case '!==': return value !== compareValue;
            case '>': return value > compareValue;
            case '>=': return value >= compareValue;
            case '<': return value < compareValue;
            case '<=': return value <= compareValue;
        }
        return false;
    }
};