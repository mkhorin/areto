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
        const message = this.getOperatorMessage(this.operator);
        return this.createMessage(this.message, message, params);
    }

    getOperatorMessage (operator) {
        switch (this.operator) {
            case '==': return 'Value must be equal to "{compareValue}"';
            case '===': return 'Value must be equal to "{compareValue}"';
            case '!=': return 'Value must not be equal to "{compareValue}"';
            case '!==': return 'Value must not be equal to "{compareValue}"';
            case '>': return 'Value must be greater than "{compareValue}"';
            case '>=': return 'Value must be greater than or equal to "{compareValue}"';
            case '<': return 'Value must be less than "{compareValue}"';
            case '<=': return 'Value must be less than or equal to "{compareValue}"';
        }
        return `Unknown operator: ${operator}`;
    }

    getInvalidValueMessage () {
        return this.createMessage(this.invalidValue, 'Invalid value');
    }

    validateAttr (attr, model) {
        const value = model.get(attr);
        let compareAttr, compareValue;
        if (Array.isArray(value)) {
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