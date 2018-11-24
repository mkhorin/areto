/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class DefaultValueValidator extends Base {

    constructor (config) {
        super({
            value: null,
            skipOnEmpty: false,
            ...config
        });
    }

    validateAttr (model, attr) {
        if (!this.isEmptyValue(model.get(attr))) {
            return;
        }
        if (typeof this.value === 'function') {
            return this.value.call(this, model, attr);
        }
        model.set(attr, this.value);
    }
};