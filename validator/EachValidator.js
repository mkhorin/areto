/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class EachValidator extends Base {

    constructor(config) {
        super({
            rule: null,
            allowRuleMessage: true,
            ...config
        });
        this._validator = null;
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid value');
    }

    getValidator (model) {
        if (this._validator === null) {
            this._validator = this.createEmbeddedValidator(model);
        }
        return this._validator;
    }

    createEmbeddedValidator (model) {
        if (this.rule instanceof Base) {
            return this.rule;
        }
        if (!(model instanceof Model)) {
            model = this.spawn(Model); // mock up context model
        }
        return this.constructor.createValidator(this.rule, model, this.attrs, this.params);
    }

    async validateAttr (model, attr) {
        const values = model.get(attr);
        const validator = this.getValidator();
        if (!(validator instanceof FilterValidator && Array.isArray(values))) {
            this.getValidator(model); // ensure model context while validator creation
            return super.validateAttr(model, attr);
        }
        const filteredValues = [];
        model.set(attr, filteredValues);
        for (let value of values) {
            if (!(Array.isArray(value) && validator.skipOnArray)) {                
                filteredValues.push(await validator.filter(value, model, attr));
            }
        }
    }

    async validateValue (values) {
        if (!Array.isArray(values)) {
            return this.getMessage();
        }
        const validator = this.getValidator();
        for (let value of values) {
            let result = await validator.validateValue(value);
            if (result) {
                return this.allowRuleMessage ? result : this.getMessage();
            }
        }
    }
};

const Model = require('../base/Model');
const FilterValidator = require('./FilterValidator');