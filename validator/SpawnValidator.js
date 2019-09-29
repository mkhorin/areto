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

    validateAttr (attr, model) {
        let value = model.get(attr);
        if (typeof value === 'string') {
            value = CommonHelper.parseJson(value);
        }
        value ? this.validateClass(value, attr, model)
              : this.addError(model, attr, this.getMessage());
    }

    validateClass (value, attr, model) {
        try {
            const Class = model.module.app.require(value.Class) || require(value.Class);
            this.BaseClass && !(Class.prototype instanceof this.BaseClass)
                ? this.addError(model, attr, this.getBaseClassMessage())
                : model.set(attr, value);
        } catch (err) {
            this.addError(model, attr, this.getInvalidFileMessage());
        }
    }
};

const CommonHelper = require('areto/helper/CommonHelper');