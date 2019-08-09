/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class NumberValidator extends Base {

    constructor (config) {
        super({
            integerOnly: false,
            max: null,
            min: null,
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Value must be a number');
    }

    getNotIntegerMessage () {
        return this.createMessage(this.message, 'Number must be a integer');
    }

    getTooSmallMessage () {
        return this.createMessage(this.tooSmall, 'Value must be no less than {min}', {min: this.min});
    }

    getTooBigMessage () {
        return this.createMessage(this.tooBig, 'Value must be no greater than {max}', {max: this.max});
    }

    async validateAttr (model, attr) {
        await super.validateAttr(model, attr);
        if (!model.hasError()) {
            model.set(attr, Number(model.get(attr)));
        }
    }

    validateValue (value) {
        const number = parseFloat(value);
        if (isNaN(number) || String(number).length !== String(value).length) {
            return this.integerOnly
                ? this.getNotIntegerMessage()
                : this.getMessage();
        }
        if (this.integerOnly && !Number.isInteger(number)) {
            return this.getNotIntegerMessage();
        }
        if (this.min !== null && number < this.min) {
            return this.getTooSmallMessage();
        } 
        if (this.max !== null && number > this.max) {
            return this.getTooBigMessage();
        }
    }
};