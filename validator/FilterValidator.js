/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class FilterValidator extends Base {

    static async filterSplit (value, attr, model, validator) {
        return StringHelper.split(value, validator.separator);
    }

    static async filterTrim (value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    constructor (config) {
        super({
            method: null,
            skipOnEmpty: false,
            skipOnArray: false,
            separator: ',',
            ...config
        });
        this.prepareFilter();
    }

    prepareFilter () {
        let {method} = this;
        if (method === null) {
            throw new Error('Method property must be set');
        }
        if (typeof method === 'string') {
            method = `filter${StringHelper.capitalize(method)}`;
            method = this.constructor[method];
            if (typeof method !== 'function') {
                throw new Error(`Filter not found: ${this.method}`);
            }
        } else if (typeof method !== 'function') {
            throw new Error('Method must be string or function');
        }
        this.method = method;
    }

    async validateAttr (attr, model) {
        const value = model.get(attr);
        if (Array.isArray(value) && this.skipOnArray) {
            return;
        }
        const result = await this.method(value, attr, model, this);
        result instanceof Message
            ? this.addError(model, attr, result)
            : model.set(attr, result);
    }
};

const StringHelper = require('../helper/StringHelper');
const Message = require('../i18n/Message');