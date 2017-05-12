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
                        cb(null, typeof value === 'object' ? value : JSON.parse(value));
                    } catch (err) {
                        cb(null, value, this.createMessage('message', 'Invalid JSON'));
                    }
                },
                'lowerCase': function (value, cb) {
                    cb(null, typeof value === 'string' ? value.toLowerCase() : value);
                },
                'mongoId': function (value, cb) {
                    ObjectID.isValid(value)
                        ? cb(null, ObjectID(value))
                        : cb(null, value, this.createMessage('message', 'Invalid MongoId'));
                },
                'trim': function (value, cb) {
                    cb(null, typeof value === 'string' ? value.trim() : value);
                },
                'upperCase': function (value, cb) {
                    cb(null, typeof value === 'string' ? value.toUpperCase() : value);
                }
            }
        };
    }

    constructor (config) {
        super(Object.assign({
            filter: null,
            skipOnArray: false
        }, config));
    }

    init () {
        super.init();
        if (this.filter === null) {
            throw new Error('FilterValidator: The filter property must be set');
        }
        if (typeof this.filter === 'string') {
            if (!this.BUILTIN.hasOwnProperty(this.filter)) {
                throw new Error(`FilterValidator: Not found builtin filter: ${this.filter}`);
            }
            this.filter = this.BUILTIN[this.filter];
        } else if (typeof this.filter !== 'function') {
            throw new Error('FilterValidator: The filter must be function');
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (this.skipOnArray && value instanceof Array) {
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