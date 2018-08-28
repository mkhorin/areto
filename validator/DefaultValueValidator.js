'use strict';

const Base = require('./Validator');

module.exports = class DefaultValueValidator extends Base {

    constructor (config) {
        super(Object.assign({
            value: null,
            skipOnEmpty: false
        }, config));
    }

    async validateAttr (model, attr) {
        if (!this.isEmptyValue(model.get(attr))) {
            return;
        }
        if (typeof this.value === 'function') {
            return this.value.call(this, model, attr);
        }
        model.set(attr, this.value);
    }
};