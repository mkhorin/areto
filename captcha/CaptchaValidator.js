'use strict';

const Base = require('../validators/Validator');

module.exports = class CaptchaValidator extends Base {

    constructor (config) {
        super(Object.assign({
            CaptchaController: null, 
            captchaActionId: 'captcha'
        }, config));
    }

    init () {
        super.init();
        this.skipOnEmpty = false;
        if (!this.CaptchaController) {
            throw new Error(this.wrapClassMessage('Controller class must be set'));
        }
    }

    getMessage () {
        return this.createMessage(this.message, 'The verification code is incorrect');
    }

    validateAttr (model, attr, cb) {
        if (!(model.controller instanceof Controller)) {
            return cb(this.wrapClassMessage('Model must have a controller property'));
        }
        let controller = new this.CaptchaController;
        controller.assignFrom(model.controller);
        let action = controller.createAction(this.captchaActionId);
        if (!action.validate(model.get(attr))) {
            this.addError(model, attr, this.getMessage());
        }
        cb();
    }
};

const Controller = require('../base/Controller');