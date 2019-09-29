/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class JsonValidator extends Base {

    getMessage () {
        return this.createMessage(this.message, 'Invalid JSON');
    }

    async validateAttr (attr, model) {
        const value = model.get(attr);
        if (typeof value !== 'object') {
            try {
                model.set(attr, JSON.parse(value));
            } catch (err) {
                this.addError(model, attr, this.getMessage());
            }
        }
    }
};