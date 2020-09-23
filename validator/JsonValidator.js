/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class JsonValidator extends Base {

    constructor (config) {
        super({
            parsed: false,
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid JSON');
    }

    async validateAttr (attr, model) {
        let value = model.get(attr);
        if (typeof value === 'string') {
            try {
                const data = JSON.parse(value);
                model.set(attr, this.parsed ? data : value.trim());
            } catch {
                this.addError(model, attr, this.getMessage());
            }
        }
    }
};