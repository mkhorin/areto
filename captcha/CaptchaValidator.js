'use strict';

const Base = require('../validator/Validator');

module.exports = class CaptchaValidator extends Base {

    constructor (config) {
        super(Object.assign({
            captchaActionProp: 'captchaAction'
        }, config));
    }

    init () {
        super.init();
        this.skipOnEmpty = false;
    }

    getMessage () {
        return this.createMessage(this.message, 'The verification code is incorrect');
    }

    validateAttr (model, attr, cb) {
        if (!(model[this.captchaActionProp] instanceof CaptchaAction)) {
            return cb(this.wrapClassMessage(`Not found model captcha action property: ${this.captchaActionProp}`));
        }
        if (!model[this.captchaActionProp].validate(model.get(attr))) {
            this.addError(model, attr, this.getMessage());
        }
        cb();
    }
};

const CaptchaAction = require('../captcha/CaptchaAction');