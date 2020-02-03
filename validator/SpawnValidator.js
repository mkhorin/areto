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

    getBaseClassNotFoundMessage () {
        return this.createMessage(this.wrongBaseClass, 'Base class not found');
    }

    getInvalidFileMessage () {
        return this.createMessage(this.wrongBaseClass, 'Invalid class file');
    }

    validateAttr (attr, model) {
        let value = model.get(attr);
        if (typeof value === 'string') {
            value = CommonHelper.parseJson(value);
        }
        value ? this.validateClass(value, attr, model)
              : this.addError(model, attr, this.getMessage());
    }

    validateClass (value, attr, model) {
        const BaseClass = this.getBaseClass(model);
        if (BaseClass === false) {
            return this.addError(model, attr, this.getBaseClassNotFoundMessage());
        }
        try {
            const Class = typeof value.Class === 'string'
                ? model.module.app.require(value.Class) || require(value.Class)
                : value.Class;
            if (BaseClass && !(Class.prototype instanceof BaseClass)) {
                this.addError(model, attr, this.getBaseClassMessage());
            }
        } catch {
            this.addError(model, attr, this.getInvalidFileMessage());
        }
    }

    getBaseClass (model) {
        if (typeof this.BaseClass !== 'string') {
            return this.BaseClass;
        }
        try {
            return model.module.require(this.BaseClass)
                || model.module.app.require(this.BaseClass)
                || require(this.BaseClass);

        } catch {
            return false;
        }
    }
};

const CommonHelper = require('areto/helper/CommonHelper');