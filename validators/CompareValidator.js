'use strict';

const Base = require('./Validator');

module.exports = class CompareValidator extends Base {

    constructor (config) {
        super(Object.assign({
            compareAttr: null,
            compareValue: null,
            type: 'string',
            operator: '=='
        }, config));
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

    validateAttr (model, attr, cb) {
        let value = model.get(attr), compareAttr, compareValue;
        if (value instanceof Array) {
            this.addError(model, attr, this.getInvalidValueMessage());
        } else if (this.compareValue !== null) {
            compareAttr = compareValue = this.compareValue;
        } else {
            compareValue = model.get(this.compareAttr);
            compareAttr = model.getLabel(this.compareAttr);
        }
        if (!this.compareValues(this.operator, this.type, value, compareValue)) {
            this.addError(model, attr, this.getMessage({compareAttr, compareValue}));
        }
        cb();
    }

    validateValue (value, cb) {
        if (this.compareValue === null) {
            return cb(this.wrapClassMessage('Value must be set'));
        }
        if (this.compareValues(this.operator, this.type, value, this.compareValue)) {
            return cb(null, this.getMessage({
                compareAttr: this.compareAttr,
                compareValue: this.compareValue
            }));
        }
        cb();
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