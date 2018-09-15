/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('./Validator');

module.exports = class RangeValidator extends Base {

    constructor (config) {
        super(Object.assign({
            range: null,
            not: false,
            allowArray: false
        }, config));

        if (!(this.range instanceof Array)) {
            throw new Error(this.wrapClassMessage('Range property must be array'));
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid range');
    }

    validateValue (value) {
        if (value instanceof Array && !this.allowArray) {
            return this.getMessage();
        }
        let inRange = true;
        let values = value instanceof Array ? value : [value];
        for (let item of values) {
            if (!this.range.includes(item)) {
                inRange = false;
                break;
            }
        }
        return this.not !== inRange ? null : this.getMessage();
    }
};