/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class InlineValidator extends Base {

    constructor (config) {
        super({
            method: null,
            params: null,
            ...config
        });
    }

    validateAttr (attr, model) {
        const method = this.method;
        return typeof method === 'string'
            ? model[method](attr, this.params)
            : method.call(model, attr, model, this.params);
    }
};