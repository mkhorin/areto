'use strict';

const Base = require('./Validator');
const ObjectID = require('mongodb').ObjectID;

module.exports = class FilterValidator extends Base {

    static getConstants () {
        return {
            BUILTIN: {
                'boolean': function (value, cb) {
                    cb(null, value == 'on' ? true : false);
                },
                'json': function (value, cb) {
                    try {
                        cb(null, (!value || typeof value === 'object') ? value : JSON.parse(value));
                    } catch (err) {
                        cb(null, value, this.createMessage('message', 'Invalid JSON'));
                    }
                },
                'mongoId': function (value, cb) {
                    if (!value) {
                        return cb(null, value);
                    }
                    ObjectID.isValid(value)
                        ? cb(null, ObjectID(value))
                        : cb(null, value, this.createMessage('message', 'Invalid MongoID'));
                }
            }
        };
    }

    constructor (config) {
        super(Object.assign({
            filter: null,
            skipOnEmpty: false,
            skipOnArray: false
        }, config));
    }

    init () {
        super.init();
        if (this.filter === null) {
            throw new Error(`${this.constructor.name}: The filter property must be set`);
        }
        if (typeof this.filter === 'string') {
            if (this.BUILTIN.hasOwnProperty(this.filter)) {
                this.filter = this.BUILTIN[this.filter];
            }
        } else if (typeof this.filter !== 'function') {
            throw new Error(`${this.constructor.name}: The filter must be function`);
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (value instanceof Array && this.skipOnArray) {
            return cb();
        }
        if (typeof this.filter === 'string') {
            if (value === null || value == undefined) {
                return cb();
            }
            if (typeof value[this.filter] !== 'function') {
                return cb(`Not found inline filter "${this.filter}" of the ${value.constructor.name} class`);
            }
            try {
                model.set(attr, value[this.filter]());
            } catch (err) {
                return cb(err);
            }
            return cb();
        }
        this.filter(value, (err, result, msg)=> {
            if (err) {
                return cb(err);
            }
            msg ? this.addError(model, attr, msg) : model.set(attr, result);
            cb();
        }, model, attr);
    }
};
module.exports.init();