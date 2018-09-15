/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RelationValidator extends Base {

    constructor (config) {
        super(Object.assign({
            required: false,
            min: null,
            max: null,
            unique: null,
            allow: null, // allow changes ['unlinks', ...]
            deny: null,
            filter: null, // async handler(value, model, attr)
            behavior: 'relationChange'
        }, config));
        
        if (this.allow && this.deny) {
            throw new Error(this.wrapClassMessage('Allowed only one permission'));
        }
        this.skipOnEmpty = false;
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid relation request');
    }

    getRequiredMessage () {
        return this.createMessage(this.requiredMessage, 'Value cannot be blank');
    }

    getExistMessage () {
        return this.createMessage(this.existMessage, 'Value does not exist');
    }

    getUniqueMessage () {
        return this.createMessage(this.uniqueMessage, 'Value has already been taken');
    }

    getTooFewMessage () {
        return this.createMessage(this.tooFew, 'Relation should contain at least {min} lnk.', {
            min: this.min
        });
    }

    getTooManyMessage () {
        return this.createMessage(this.tooMany, 'Relation should contain at most {max} lnk.', {
            max: this.max
        });
    }

    async validateAttr (model, attr) {
        let behavior = model.getBehavior(this.behavior);
        if (!behavior) {
            throw new Error(this.wrapClassMessage('Not found relation behavior'));
        }
        let data = behavior.getChanges(attr);
        if (data === false) {
            return this.addError(model, attr, this.getMessage());
        }
        if (data) {
            this.filterChanges(data);
        }
        if (data && this.filter) {
            await this.filter(data, model, attr);
        }
        await this.checkCounter(behavior, model, attr);
        if (this.unique !== null) {
            this.checkUnique(behavior, model, attr);
        }
    }

    filterChanges (data) {
        if (this.allow instanceof Array) {
            for (let key of Object.keys(data)) {
                if (!this.allow.includes(key)) {
                    data[key] = [];
                }
            }
        }
        if (this.deny instanceof Array) {
            for (let key of Object.keys(data)) {
                if (this.deny.includes(key)) {
                    data[key] = [];
                }
            }
        }
    }

    async checkCounter (behavior, model, attr) {
        if (!this.required && !this.min && !this.max) {
            return;
        }
        let docs = await behavior.getLinkedDocs(attr);
        if (this.required && docs.length < 1) {
            this.addError(model, attr, this.getRequiredMessage());
        }
        if (this.min && docs.length < this.min) {
            this.addError(model, attr, this.getTooFewMessage());
        }
        if (this.max && docs.length > this.max) {
            this.addError(model, attr, this.getTooManyMessage());
        }
    }

    async checkUnique (behavior, model, attr) {
        let exist = await behavior.checkExist(attr);
        if (this.unique === true && exist === true) {
            this.addError(model, attr, this.getUniqueMessage());
        }
        if (this.unique === false && exist === false) {
            this.addError(model, attr, this.getExistMessage());
        }
    }
};