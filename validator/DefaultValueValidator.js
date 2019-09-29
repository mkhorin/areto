/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
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

    async validateAttr (attr, model) {
        if (!this.isEmptyValue(model.get(attr))) {
            return;
        }
        model.set(attr, typeof this.value === 'function'
            ? await this.value.call(this, attr, model, this)
            : this.value);
    }
};