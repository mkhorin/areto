'use strict';

const Base = require('./Validator');

module.exports = class MongoIdValidator extends Base {

    constructor (config) {
        super(Object.assign({
            normalize: true,
            skipOnEmpty: false
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid MongoID');
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (this.isEmptyValue(value)) {
            model.set(attr, null);
            return cb();
        }
        this.validateValue(value, (err, msg, params)=> {
            if (err) {
                return cb(err);
            }
            if (msg) {
                this.addError(model, attr, msg, params)
            } else if (this.normalize) {
                model.set(attr, MongoDriver.MongoId(model.get(attr)));
            }
            cb();
        });
    }

    validateValue (value, cb) {
        MongoDriver.MongoId.isValid(value) ? cb() : cb(null, this.message);
    }
};

const MongoDriver = require('../db/MongoDriver');