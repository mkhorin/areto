/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class IdValidator extends Base {

    constructor (config) {
        super(Object.assign({
            normalize: true,
            skipOnEmpty: false
        }, config));
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid ID');
    }

    validateAttr (model, attr) {
        let value = model.get(attr);
        if (this.isEmptyValue(value)) {
            return model.set(attr, null);
        }
        value = model.getDb().normalizeId(value);
        if (value === null) {
            this.addError(model, attr, this.getMessage());
        } else if (this.normalize) {
            model.set(attr, value);
        }
    }
};