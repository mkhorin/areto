/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class FilterValidator extends Base {

    static async filterSplit (value, model, attr, validator) {
        return StringHelper.split(value, validator.separator);
    }

    static async filterTrim (value) {
        return typeof value === 'string' ? value.trim() : '';
    }

    constructor (config) {
        super({
            filter: null,
            skipOnEmpty: false,
            skipOnArray: false,
            separator: ',',
            ...config
        });
        this.prepareFilter();
    }

    prepareFilter () {
        let filter = this.filter;
        if (filter === null) {
            throw new Error(this.wrapClassMessage('Filter property must be set'));
        }
        if (typeof filter === 'string') {
            filter = `filter${StringHelper.toFirstUpperCase(filter)}`;
            filter = this.constructor[filter];
            if (typeof filter !== 'function') {
                throw new Error(this.wrapClassMessage(`Inline filter not found: ${this.filter}`));
            }
        } else if (typeof filter !== 'function') {
            throw new Error(this.wrapClassMessage('Filter must be function'));
        }
        this.filter = filter;
    }

    async validateAttr (model, attr) {
        const value = model.get(attr);
        if (Array.isArray(value) && this.skipOnArray) {
            return;
        }
        if (typeof this.filter === 'function') {
            return this.executeFilter(value, model, attr);
        }
        if (value === null || value === undefined) {
            return;
        }
        if (typeof value[this.filter] !== 'function') {
            throw new Error(`Inline filter not found: ${this.filter}: in ${value.constructor.name}`);
        }
        model.set(attr, await value[this.filter]());
    }

    async executeFilter (value, model, attr) {
        const result = await this.filter(value, model, attr, this);
        result instanceof Message
            ? this.addError(model, attr, result)
            : model.set(attr, result);
    }
};

const StringHelper = require('../helper/StringHelper');
const Message = require('../i18n/Message');