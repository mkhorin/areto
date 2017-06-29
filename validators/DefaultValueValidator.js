'use strict';

const Base = require('./Validator');

module.exports = class DefaultValueValidator extends Base {

    constructor (config) {
        super(Object.assign({
            value: null,
            skipOnEmpty: false
        }, config));
    }

    validateAttr (model, attr, cb) {
        if (!this.isEmptyValue(model.get(attr))) {
            return cb();
        }
        if (typeof this.value === 'function') {
            this.value.call(this, model, attr, cb);
        } else {
            model.set(attr, this.value);
            cb();
        }
    }
};