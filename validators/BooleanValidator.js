'use strict';

const Base = require('./Validator');

module.exports = class BooleanValidator extends Base {

    constructor (config) {
        super(Object.assign({
            trueValue: true,
            falseValue: false,
            strict: false,
            castValue: true
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Value must be "{true}" or "{false}"', {
            'true': this.trueValue,
            'false': this.falseValue
        });
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (this.strict ? value === this.trueValue : value == this.trueValue) {
            if (this.castValue) {
                model.set(attr, this.trueValue);
            }
        } else if (this.strict ? value === this.falseValue : value == this.falseValue) {
            if (this.castValue) {
                model.set(attr, this.falseValue);
            }
        } else {
            this.addError(model, attr, this.message);
        }
        cb();
    }

    validateValue (value, cb) {
        if ((!this.strict && (value == this.trueValue || value == this.falseValue)) 
            || (this.strict && (value === this.trueValue || value === this.falseValue))) {
            return cb();
        }
        cb(null, this.message);
    }
};