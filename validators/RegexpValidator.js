'use strict';

const Base = require('./Validator');

module.exports = class RegexpValidator extends Base {

    static getConstants () {
        return {
            BUILTIN: {
                'mongoId': /^[a-f0-9]{24}$/i
            }
        };
    }

    constructor (config) {
        super(Object.assign({
            pattern: null,
            not: false
        }, config));
    }

    init () {
        super.init();
        if (!this.pattern) {
            throw new Error(`${this.constructor.name}: Not set pattern`);
        }
        if (typeof this.pattern === 'string') {
            if (!this.BUILTIN.hasOwnProperty(this.pattern)) {
                throw new Error(`${this.constructor.name}: Not found builtin pattern: ${this.pattern}`);
            }
            this.pattern = this.BUILTIN[this.pattern];
        } else if (!(this.pattern instanceof RegExp)) {
            throw new Error(`${this.constructor.name}: Invalid pattern: ${this.pattern}`);
        }
        this.createMessage('message', 'Invalid value');
    }

    validateValue (value, cb) {
        let valid = true;
        if (typeof value !== 'string') {
            valid = false;
        } else if (this.pattern.test(value)) {
            valid = this.not ? false : true;
        } else {
            valid = this.not ? true : false;
        }
        cb(null, valid ? null : this.message);
    }
};
module.exports.init();