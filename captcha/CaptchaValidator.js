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
            throw new Error(`${this.constructor.name}: Controller class must be set`);
        }
        this.createMessage('message', 'The verification code is incorrect');
    }

    validateAttr (model, attr, cb) {
        if (!(model.controller instanceof Controller)) {
            return cb(`${this.constructor.name}: Model must have a controller property`);
        }
        let controller = new this.CaptchaController;
        controller.assignFrom(model.controller);
        let action = controller.createAction(this.captchaActionId);
        if (!action.validate(model.get(attr))) {
            this.addError(model, attr, this.message);
        }
        cb();
    }
};

const Controller = require('../base/Controller');