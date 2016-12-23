'use strict';

const Base = require('./Validator');

module.exports = class FilterValidator extends Base {

    static getConstants () {
        return {
            INLINE_FILTERS: {
                boolean: function (value, cb) {
                    cb(null, parseInt(value) ? true : false);
                },
                trim: function (value, cb) {
                    cb(null, typeof value === 'string' ? value.trim() : value);
                },
                lowerCase: function (value, cb) {
                    cb(null, typeof value === 'string' ? value.toLowerCase() : value);
                },
                upperCase: function (value, cb) {
                    cb(null, typeof value === 'string' ? value.toUpperCase() : value);
                },
                ObjectId: function (value, cb) {
                    let ObjectID = require('mongodb').ObjectID;
                    ObjectID.isValid(value) ? cb(null, ObjectID(value))
                        : cb(null, value, this.createMessage('message', 'Invalid ObjectID'));
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
        } else if (typeof this.filter === 'string') {
            let filter = this.INLINE_FILTERS[this.filter];
            if (!filter) {
                throw new Error(`FilterValidator: Not found inline filter: ${this.filter}`);
            }
            this.filter = filter;
        } else if (typeof this.filter !== 'function') {
            throw new Error('FilterValidator: The filter must be function');
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (!this.skipOnArray || !(value instanceof Array)) {
            this.filter(value, (err, result, msg)=> {
                if (err) {
                    return cb(err);
                }
                msg ? this.addError(model, attr, msg) : model.set(attr, result);
                cb();
            }, model, attr);
        } else {
            cb();
        }
    }
};
module.exports.init();