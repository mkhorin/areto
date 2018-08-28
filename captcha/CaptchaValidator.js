'use strict';

const Base = require('../validator/Validator');

module.exports = class CaptchaValidator extends Base {

    constructor (config) {
        super(Object.assign({
            captchaActionProp: 'captchaAction'
        }, config));
        
        this.skipOnEmpty = false;
    }

    getMessage () {
        return this.createMessage(this.message, 'The verification code is incorrect');
    }

    validateAttr (model, attr) {
        if (!(model[this.captchaActionProp] instanceof CaptchaAction)) {
            throw new Error(`Not found model captcha action property: ${this.captchaActionProp}`);
        }
        if (!model[this.captchaActionProp].validate(model.get(attr))) {
            this.addError(model, attr, this.getMessage());
        }
    }
};

const CaptchaAction = require('../captcha/CaptchaAction');