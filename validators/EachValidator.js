'use strict';

let Base = require('./Validator');
let async = require('async');

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

    createEmbedded (model) {
        if (this.rule instanceof Base) {
            return this.rule;
        }
        if (!(model instanceof Model)) {
            model = new Model; // mockup context model
        }
        return this.constructor.createValidator(this.rule, model, this.attributes, this.params);
    }

    validateAttr (model, attr, cb) {
        let values = model.get(attr);
        let validator = this.getValidator();
        if (validator instanceof FilterValidator && values instanceof Array) {
            let filteredValues = [];
            async.each(values, (value, cb)=> {
                value instanceof Array && validator.skipOnArray ? cb() 
                    : validator.filter(value, (err, result)=> {
                        filteredValues.push(result);
                        cb(err)
                    }, model, attr);
            }, err => {
                model.set(attr, filteredValues);
                cb(err);
            });
        } else {
            this.getValidator(model); // ensure model context while validator creation
            super.validateAttr(model, attr, cb);
        }
    }

    validateValue (values, cb) {
        if (values instanceof Array) {            
            let validator = this.getValidator();
            async.each(values, (value, cb)=> {
                validator.validateValue(value, (err, result)=> {
                    err ? cb(err) : cb(null, result ? (this.allowMessageFromRule ? result : this.message) : null);
                });
            }, cb);
        } else {
            cb(null, this.message);
        }
    }
};

let Model = require('../base/Model');
let FilterValidator = require('./FilterValidator');