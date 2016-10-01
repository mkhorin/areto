'use strict';

let Base = require('./Validator');

module.exports = class InlineValidator extends Base {

    constructor (config) {
        super(Object.assign({
            method: null,
            params: null
        }, config));
    }

    validateAttr (model, attr, cb) {
        let method = this.method;
        if (typeof method === 'string') {
            method = model[method];
        }
        method.call(model, cb, attr, this.params);
    }
};