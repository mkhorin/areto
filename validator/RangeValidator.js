'use strict';

const Base = require('./Validator');

module.exports = class RangeValidator extends Base {

    constructor (config) {
        super(Object.assign({
            range: null,
            not: false,
            allowArray: false
        }, config));
    }

    init () {
        super.init();
        if (!(this.range instanceof Array)) {
            throw new Error(this.wrapClassMessage('Range property must be array'));
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid range');
    }

    validateValue (value, cb) {
        if (!this.allowArray && value instanceof Array) {
            return cb(null, this.getMessage());
        }
        let inRange = true;
        let values = value instanceof Array ? value : [value];
        for (let item of values) {
            if (!this.range.includes(item)) {
                inRange = false;
                break;
            }
        }
        cb(null, this.not !== inRange ? null : this.getMessage());
    }
};