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
        let {Class} = value;
        if (typeof Class === 'string') {
            try {
                Class = this.module.app.require(Class) || require(Class);
            } catch (err) {
                this.addError(model, attr, this.getInvalidFileMessage());
                this.log('error', err);
            }
        }
        if (!Class) {
            return this.addError(model, attr, this.getMessage());
        }
        const BaseClass = this.getBaseClass();
        if (BaseClass && !(Class.prototype instanceof BaseClass)) {
            this.addError(model, attr, this.getBaseClassMessage());
        }
    }

    getBaseClass () {
        if (typeof this.BaseClass !== 'string') {
            return this.BaseClass;
        }
        return this.module.require(this.BaseClass)
            || this.module.app.require(this.BaseClass)
            || require(this.BaseClass);
    }
};

const CommonHelper = require('areto/helper/CommonHelper');