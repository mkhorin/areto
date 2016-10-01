'use strict';

let Base = require('./Validator');

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
        } else {
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
        }
        cb();
    }

    validateValue (value, cb) {
        if (typeof value !== 'string') {
            cb(null, this.message);
        } else {
            let length = value.length;
            if (this.min !== null && length < this.min) {
                cb(null, this.tooShort, {min: this.min});
            } else if (this.max !== null && length > this.max) {
                cb(null, this.tooLong, {max: this.max});
            } else if (this.length !== null && length !== this.length) {
                cb(null, this.notEqual, {length: this.length});
            } else cb();
        }
    }
};