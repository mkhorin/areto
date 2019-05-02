/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RangeValidator extends Base {

    constructor (config) {
        super({
            'range': null,
            'not': false,
            'allowArray': false,
            ...config
        });
        if (!Array.isArray(this.range)) {
            throw new Error(this.wrapClassMessage('Range property must be array'));
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid range');
    }

    validateValue (value) {
        if (Array.isArray(value) && !this.allowArray) {
            return this.getMessage();
        }
        let inRange = true;
        let values = Array.isArray(value) ? value : [value];
        for (let item of values) {
            if (!this.range.includes(item)) {
                inRange = false;
                break;
            }
        }
        return this.not !== inRange ? null : this.getMessage();
    }
};