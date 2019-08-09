/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class FilterValidator extends Base {

    static async filterBoolean (value) {
        return typeof value === 'boolean' ? value : value === 'on';
    }

    static async filterJson (value, model, attr, validator) {
        if (!value || typeof value === 'object') {
            return value;
        }
        value = CommonHelper.parseJson(value);
        return value === undefined ? validator.getJsonMessage() : value;
    }

    static async filterSplit (value, model, attr, validator) {
        return Array.isArray(value) ? value : typeof value === 'string' ? value.split(validator.separator) : [];
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
                throw new Error(this.wrapClassMessage(`Not found inline filter: ${this.filter}`));
            }
        } else if (typeof filter !== 'function') {
            throw new Error(this.wrapClassMessage('Filter must be function'));
        }
        this.filter = filter;
    }

    getJsonMessage () {
        return this.createMessage(this.message, 'Invalid JSON');
    }

    async validateAttr (model, attr) {
        const value = model.get(attr);
        if (Array.isArray(value) && this.skipOnArray) {
            return;
        }
        if (typeof this.filter === 'function') {
            const result = await this.filter(value, model, attr, this);
            return result instanceof Message
                ? this.addError(model, attr, result)
                : model.set(attr, result);
        }
        if (value === null || value === undefined) {
            return;
        }
        if (typeof value[this.filter] !== 'function') {
            throw new Error(`Not found inline filter '${this.filter}' in '${value.constructor.name}'`);
        }
        return model.set(attr, value[this.filter]());
    }
};
module.exports.init();

const CommonHelper = require('../helper/CommonHelper');
const StringHelper = require('../helper/StringHelper');
const Message = require('../i18n/Message');