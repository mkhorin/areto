'use strict';

const Base = require('./Validator');

module.exports = class EachValidator extends Base {

    constructor(config) {
        super(Object.assign({
            rule: null,
            allowMessageFromRule: true
        }, config));
        
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
            model = new Model; // mock up context model
        }
        return this.constructor.createValidator(this.rule, model, this.attrs, this.params);
    }

    async validateAttr (model, attr) {
        let values = model.get(attr);
        let validator = this.getValidator();
        if (!(validator instanceof FilterValidator && values instanceof Array)) {
            this.getValidator(model); // ensure model context while validator creation
            return super.validateAttr(model, attr);
        }
        let filteredValues = [];
        model.set(attr, filteredValues);
        for (let value of values) {
            if (!(value instanceof Array && validator.skipOnArray)) {
                let result = await validator.filter(value, model, attr);
                filteredValues.push(result);
            }
        }
    }

    async validateValue (values) {
        if (!(values instanceof Array)) {
            return this.getMessage();
        }
        let validator = this.getValidator();
        for (let value of values) {
            let result = await validator.validateValue(value);
            if (result) {
                return this.allowMessageFromRule ? result : this.getMessage();
            }
        }
    }
};

const Model = require('../base/Model');
const FilterValidator = require('./FilterValidator');