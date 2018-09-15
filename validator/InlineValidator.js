/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class InlineValidator extends Base {

    constructor (config) {
        super(Object.assign({
            method: null,
            params: null
        }, config));
    }

    validateAttr (model, attrName) {
        let method = this.method;
        if (typeof method === 'string') {
            method = model[method];
        }
        return method.call(model, attrName, this.params);
    }
};