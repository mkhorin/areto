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

    validateAttr (model, attr) {
        const value = model.get(attr);
        if (typeof value !== 'boolean' ) {
            model.set(attr, value === 'on');
        }
    }
};