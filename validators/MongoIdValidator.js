'use strict';

const Base = require('./Validator');

module.exports = class MongoIdValidator extends Base {

    constructor (config) {
        super(Object.assign({
            normalize: true
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Invalid MongoID');
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, msg, params)=> {
            if (err) {
                return cb(err);
            }
            if (msg) {
                this.addError(model, attr, msg, params)
            } else if (this.normalize) {
                model.set(attr, ObjectID(model.get(attr)));
            }
            cb();
        });
    }

    validateValue (value, cb) {
        ObjectID.isValid(value) ? cb() : cb(null, this.message);
    }
};

const ObjectID = require('mongodb').ObjectID;