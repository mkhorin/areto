'use strict';

const Base = require('./Validator');

module.exports = class FilterValidator extends Base {

    static getConstants () {
        return {
            BUILTIN: {
                'boolean': function (value, cb) {
                    cb(null, typeof value === 'boolean' ? value : value === 'on');
                },
                'json': function (value, cb) {
                    if (!value || typeof value === 'object') {
                        return cb(null, value);
                    }
                    value = CommonHelper.parseJson(value);
                    value === undefined
                        ? cb(null, value, this.createMessage(this.message, 'Invalid JSON'))
                        : cb(null, value);
                },
                'split': function (value, cb) {
                    if (!Array.isArray(value)) {
                        value = this.isEmptyValue(value) ? [] : String(value).split(this.separator);
                    }
                    cb(null, value);
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
    }

    init () {
        super.init();
        if (this.filter === null) {
            throw new Error(this.wrapClassMessage('The filter property must be set'));
        }
        if (typeof this.filter === 'string') {
            if (Object.prototype.hasOwnProperty.call(this.BUILTIN, this.filter)) {
                this.filter = this.BUILTIN[this.filter];
            }
        } else if (typeof this.filter !== 'function') {
            throw new Error(this.wrapClassMessage('The filter must be function'));
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (value instanceof Array && this.skipOnArray) {
            return cb();
        }
        if (typeof this.filter === 'string') {
            if (value === null || value === undefined) {
                return cb();
            }
            if (typeof value[this.filter] !== 'function') {
                return cb(this.wrapClassMessage(`Not found inline filter '${this.filter}' of '${value.constructor.name}'`));
            }
            try {
                model.set(attr, value[this.filter]());
            } catch (err) {
                return cb(err);
            }
            return cb();
        }
        this.filter(value, (err, result, message)=> {
            if (err) {
                return cb(err);
            }
            message ? this.addError(model, attr, message)
                    : model.set(attr, result);
            cb();
        }, model, attr);
    }
};
module.exports.init();

const CommonHelper = require('../helpers/CommonHelper');