'use strict';

const Base = require('./Validator');

module.exports = class EmailValidator extends Base {

    constructor (config) {
        super(Object.assign({
            pattern: '^[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$'
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid email');
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, msg, params)=> {
            if (err) {
                return cb(err);
            }
            if (msg) {
                this.addError(model, attr, msg, params)
            }
            cb();
        });
    }

    validateValue (value, cb) {
        // make sure string length is limited to avoid DOS attacks
        if (typeof value !== 'string' || value.length > 128) {
            return cb(null, this.message);
        }
        if (!(new RegExp(this.pattern)).test(value)) {
            return cb(null, this.message);
        }
        cb();
    }
};