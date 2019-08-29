/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../validator/Validator');

module.exports = class CaptchaValidator extends Base {

    constructor (config) {
        super({
            captchaActionProperty: 'captchaAction',
            ...config
        });        
        this.skipOnEmpty = false;
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid verification code');
    }

    validateAttr (model, attr) {
        const action = model[this.captchaActionProperty];
        if (!(action instanceof CaptchaAction)) {
            throw new Error(`Model captcha action property not found: ${this.captchaActionProperty}`);
        }
        if (!action.validate(model.get(attr))) {
            this.addError(model, attr, this.getMessage());
        }
    }
};

const CaptchaAction = require('./CaptchaAction');