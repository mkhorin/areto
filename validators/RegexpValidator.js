'use strict';

let Base = require('./Validator');

module.exports = class RegexpValidator extends Base {

    constructor (config) {
        super(Object.assign({
            pattern: null,
            not: false
        }, config));
    }

    init () {
        super.init();
        if (!this.pattern) {
            throw new Error('RegexpValidator: Not set pattern');
        }
        if (typeof this.pattern === 'string') {
            let fn = this[`getPattern${this.pattern}`];
            if (typeof fn !== 'function') {
                throw new Error(`RegexpValidator: Not found inline pattern: ${this.pattern}`);
            }
            this.pattern = fn.call(this);
        } else if (!(this.pattern instanceof RegExp)) {
            throw new Error(`RegexpValidator: Invalid pattern: ${this.pattern}`);
        }
        this.createMessage('message', 'Invalid value');
    }

    validateValue (value, cb) {
        let valid = !(value instanceof Array) 
            && (!this.not && this.pattern.test(value) || this.not && !this.pattern.test(value));
        cb(null, valid ? null : this.message);
    }

    // PATTERNS

    getPatternObjectId () {
        return /^[a-f0-9]{24}$/i;
    }
};