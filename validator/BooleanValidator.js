/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class BooleanValidator extends Base {

    constructor (config) {
        super({
            trueValue: true,
            falseValue: false,
            strict: false,
            castValue: true,
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Value must be "{true}" or "{false}"', {
            'true': this.trueValue,
            'false': this.falseValue
        });
    }

    validateAttr (attr, model) {
        const value = model.get(attr);
        if (this.strict ? value === this.trueValue : value == this.trueValue) {
            if (this.castValue) {
                model.set(attr, this.trueValue);
            }
        } else if (this.strict ? value === this.falseValue : value == this.falseValue) {
            if (this.castValue) {
                model.set(attr, this.falseValue);
            }
        } else {
            this.addError(model, attr, this.getMessage());
        }
    }

    validateValue (value) {
        if (this.strict) {
            if (value === this.trueValue || value === this.falseValue) {
                return;
            }
        } else if (value == this.trueValue || value == this.falseValue) {
            return;
        }
        return this.getMessage();
    }
};