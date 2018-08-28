'use strict';

const Base = require('./Validator');

module.exports = class InlineValidator extends Base {

    constructor (config) {
        super(Object.assign({
            method: null,
            params: null
        }, config));
    }

    async validateAttr (model, attrName) {
        let method = this.method;
        if (typeof method === 'string') {
            method = model[method];
        }
        await method.call(model, attrName, this.params);
    }
};