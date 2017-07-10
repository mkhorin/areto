'use strict';

const Base = require('./Validator');

module.exports = class StringValidator extends Base {

    constructor (config) {
        super(Object.assign({
            length: null,
            max: null,
            min: null
        }, config));
    }

    init () {
        super.init();
        this.createMessage('message', 'Value must be a string');
        if (this.min !== null) {
            this.createMessage('tooShort', 'Value should contain at least {min} chr.');
        }
        if (this.max !== null) {
            this.createMessage('tooLong', 'Value should contain at most {max} chr.');
        }
        if (this.length !== null) {
            this.createMessage('notEqual', 'Value should contain {length} chrs.');
        }
    }

    validateAttr (model, attr, cb) {
        let value = model.get(attr);
        if (typeof value !== 'string') {
            this.addError(model, attr, this.message);
            return cb();
        }
        let length = value.length;
        if (this.min !== null && length < this.min) {
            this.addError(model, attr, this.tooShort, {min: this.min});
        }
        if (this.max !== null && length > this.max) {
            this.addError(model, attr, this.tooLong, {max: this.max});
        }
        if (this.length !== null && length !== this.length) {
            this.addError(model, attr, this.notEqual, {length: this.length});
        }
        cb();
    }

    validateValue (value, cb) {
        if (typeof value !== 'string') {
            return cb(null, this.message);
        }
        let length = value.length;
        if (this.min !== null && length < this.min) {
            return cb(null, this.tooShort, {min: this.min});
        }
        if (this.max !== null && length > this.max) {
            return cb(null, this.tooLong, {max: this.max});
        }
        if (this.length !== null && length !== this.length) {
            return cb(null, this.notEqual, {length: this.length});
        } 
        cb();
    }
};