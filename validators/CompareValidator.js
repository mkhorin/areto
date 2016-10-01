'use strict';

let Base = require('./Validator');

module.exports = class CompareValidator extends Base {

    constructor (config) {
        super(Object.assign({
            compareAttribute: null,
            compareValue: null,
            type: 'string',
            operator: '=='
        }, config));
    }

    init () {
        super.init();
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
            default: throw new Error(`CompareValidator: Unknown operator: ${this.operator}`);
        }
        this.createMessage('message', message);
        this.createMessage('invalidValue', 'Invalid value');
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr), compareLabel, compareValue;
        if (value instanceof Array) {
            this.addError(model, attr, this.invalidValue);
        } else if (this.compareValue !== null) {
            compareLabel = compareValue = this.compareValue;
        } else {
            compareValue = model.get(this.compareAttribute);
            compareLabel = model.getLabel(this.compareAttribute);
        }
        if (!this.compareValues(this.operator, this.type, value, compareValue)) {
            this.addError(model, attr, this.message, {
                compareAttribute: compareLabel,
                compareValue: compareValue
            });
        }
        cb();
    }

    validateValue (value, cb) {
        if (this.compareValue === null) {
            cb('CompareValidator: Value must be set');
        } else if (this.compareValues(this.operator, this.type, value, this.compareValue)) {
            cb(null, this.message, {
                compareAttribute: this.compareAttribute,
                compareValue: this.compareValue
            });
        } else cb();
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
            default: return false;
        }
    }
};