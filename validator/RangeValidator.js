/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RangeValidator extends Base {

    constructor (config) {
        super({
            // values: []
            not: false,
            allowArray: false,
            ...config
        });
        if (!Array.isArray(this.values)) {
            throw new Error('Values property must be array');
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
        const values = Array.isArray(value) ? value : [value];
        for (const item of values) {
            if (!this.values.includes(item)) {
                inRange = false;
                break;
            }
        }
        return this.not !== inRange ? null : this.getMessage();
    }
};