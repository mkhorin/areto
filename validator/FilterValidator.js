/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class FilterValidator extends Base {

    static getConstants () {
        return {
            FILTERS: {
                'boolean': async value => {
                    return typeof value === 'boolean' ? value : value === 'on';
                },
                'json': async value => {
                    if (!value || typeof value === 'object') {
                        return value;
                    }
                    value = CommonHelper.parseJson(value);
                    return value === undefined
                        ? this.createMessage(this.message, 'Invalid JSON')
                        : value;
                },
                'split': async value => {
                    return value instanceof Array ? value
                        : (typeof value === 'string' ? value.split(this.separator) : []);
                }
            }
        };
    }

    constructor (config) {
        super(Object.assign({
            filter: null,
            skipOnEmpty: false,
            skipOnArray: false,
            separator: ','
        }, config));

        if (this.filter === null) {
            throw new Error(this.wrapClassMessage('Filter property must be set'));
        }
        if (typeof this.filter === 'string') {
            if (Object.prototype.hasOwnProperty.call(this.FILTERS, this.filter)) {
                this.filter = this.FILTERS[this.filter];
            }
        } else if (typeof this.filter !== 'function') {
            throw new Error(this.wrapClassMessage('Filter must be function'));
        }
    }

    async validateAttr (model, attr) {
        let value = model.get(attr);
        if (value instanceof Array && this.skipOnArray) {
            return;
        }
        if (typeof this.filter === 'function') {
            let result = await this.filter(value, model, attr);
            return result instanceof Message
                ? this.addError(model, attr, result)
                : model.set(attr, result);
        }
        if (value === null || value === undefined) {
            return;
        }
        if (typeof value[this.filter] !== 'function') {
            throw new Error(`Not found inline filter '${this.filter}' of '${value.constructor.name}'`);
        }
        return model.set(attr, value[this.filter]());
    }
};
module.exports.init();

const CommonHelper = require('../helper/CommonHelper');
const Message = require('../i18n/Message');