'use strict';

let Base = require('./Validator');

module.exports = class EmailValidator extends Base {

    constructor (config) {
        super(Object.assign({
            pattern: /^[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&\'*+\\/=?^_`{|}~-]+)*@(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid email');
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, msg, params)=> {
            if (!err) {
                msg ? this.addError(model, attr, msg, params)
                    : model.set(attr, model.get(attr).toLowerCase());    
            } 
            cb(err);
        });
    }

    validateValue (value, cb) {
        // make sure string length is limited to avoid DOS attacks
        cb(null, typeof value !== 'string' || value.length > 128 || !this.pattern.test(value) ? this.message : null);
    }
};