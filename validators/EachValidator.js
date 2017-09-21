'use strict';

const Base = require('./Validator');

module.exports = class EachValidator extends Base {

    constructor(config) {
        super(Object.assign({
            rule: null,
            allowMessageFromRule: true
        }, config));
    }

    init () {
        super.init();
        this._validator = null;
        this.createMessage('message', 'Invalid value');
    }

    getValidator (model) {
        if (this._validator === null) {
            this._validator = this.createEmbeddedValidator(model);
        }
        return this._validator;
    }

    createEmbeddedValidator (model) {
        if (this.rule instanceof Base) {
            return this.rule;
        }
        if (!(model instanceof Model)) {
            model = new Model; // mockup context model
        }
        return this.constructor.createValidator(this.rule, model, this.attrs, this.params);
    }

    validateAttr (model, attr, cb) {
        let values = model.get(attr);
        let validator = this.getValidator();
        if (validator instanceof FilterValidator && values instanceof Array) {
            let filteredValues = [];
            model.set(attr, filteredValues);
            async.eachSeries(values, (value, cb)=> {
                if (value instanceof Array && validator.skipOnArray) {
                    return cb();
                }
                validator.filter(value, (err, result)=> {
                    filteredValues.push(result);
                    cb(err)
                }, model, attr);
            }, cb);
        } else {
            this.getValidator(model); // ensure model context while validator creation
            super.validateAttr(model, attr, cb);
        }
    }

    validateValue (values, cb) {
        if (!(values instanceof Array)) {
            return cb(null, this.message);
        }
        let validator = this.getValidator();
        async.eachSeries(values, (value, cb)=> {
            validator.validateValue(value, (err, result)=> {
                err ? cb(err)
                    : cb(null, result ? (this.allowMessageFromRule ? result : this.message) : null);
            });
        }, cb);
    }
};

const async = require('async');
const Model = require('../base/Model');
const FilterValidator = require('./FilterValidator');