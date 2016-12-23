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
            throw new Error('CaptchaValidator: Controller class must be set');
        }
        this.createMessage('message', 'The verification code is incorrect.');
    }

    validateAttr (model, attr, cb) {
        if (model.controller instanceof Controller) {
            let controller = new this.CaptchaController;
            controller.assignFrom(model.controller);
            let action = controller.createAction(this.captchaActionId);
            if (!action.validate(model.get(attr))) {
                this.addError(model, attr, this.message);
            }
            cb();
        } else {
            cb(`CaptchaValidator: The ${model.constructor.name} must have a controller property`);
        }
    }
};

const Controller = require('../base/Controller');