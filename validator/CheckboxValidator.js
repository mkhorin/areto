/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class CheckboxValidator extends Base {

    constructor (config) {
        super({
            skipOnEmpty: false,
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid value');
    }

    validateAttr (attr, model) {
        const value = model.get(attr);
        if (typeof value === 'boolean' ) {
            return true;
        }
        const trueValue = value === 'true' || value === 'on';
        if (value && value !== 'false' && !trueValue) {
            return this.addError(model, attr, this.getMessage());
        }
        model.set(attr, trueValue);
    }
};