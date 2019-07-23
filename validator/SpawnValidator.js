'use strict';

const Base = require('areto/validator/Validator');

module.exports = class SpawnValidator extends Base {

    constructor (config) {
        super({
            BaseClass: require('areto/base/Base'),
            ...config
        });
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid spawn configuration');
    }

    getBaseClassMessage () {
        return this.createMessage(this.wrongBaseClass, 'Base class must be {name}', {
            name: this.BaseClass.name
        });
    }

    getInvalidFileMessage () {
        return this.createMessage(this.wrongBaseClass, 'Invalid class file');
    }

    validateAttr (model, attr) {
        let value = model.get(attr);
        if (typeof value === 'string') {
            value = CommonHelper.parseJson(value);
        }
        if (!value) {
            return this.addError(model, attr, this.getMessage());
        }
        try {
            let Class = model.module.app.require(value.Class) || require(value.Class);
            if (this.BaseClass && !(Class.prototype instanceof this.BaseClass)) {
                this.addError(model, attr, this.getBaseClassMessage());
            } else {
                model.set(attr, value);
            }
        } catch (err) {
            model.module.logError(this.constructor.name, err);
            this.addError(model, attr, this.getInvalidFileMessage());
        }
    }
};

const CommonHelper = require('areto/helper/CommonHelper');