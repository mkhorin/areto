/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class RelationValidator extends Base {

    /**
     * @param {Object} config
     * @param {string[]} config.allow - Allow changes: ['links', 'unlinks', 'deletes']
     * @param {string[]} config.deny - Deny changes: ['links', 'unlinks', 'deletes']
     * @param {function} config.filter - (value, attr, model) => ...
     * @param {string} config.behavior - Relation changing behavior
     */
    constructor (config) {
        super({
            required: false,
            min: null,
            max: null,
            unique: null, 
            allow: null,
            deny: null,
            filter: null,
            behavior: 'relationChange',
            ...config
        });
        if (this.allow && this.deny) {
            throw new Error('Allowed only one permission');
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
        return this.createMessage(this.tooFew, 'Relation should contain at least {min} objects', {
            min: this.min
        });
    }

    getTooManyMessage () {
        return this.createMessage(this.tooMany, 'Relation should contain at most {max} objects', {
            max: this.max
        });
    }

    async validateAttr (attr, model) {
        const behavior = model.getBehavior(this.behavior);
        if (!behavior) {
            throw new Error('Relation behavior not found');
        }
        const data = behavior.getChanges(attr);
        if (data === false) {
            return this.addError(model, attr, this.getMessage());
        }
        if (data) {
            this.filterChanges(data);
        }
        if (data && this.filter) {
            await this.filter(data, attr, model);
        }
        await this.checkCounter(behavior, attr, model);
        if (this.unique !== null) {
            await this.checkUnique(behavior, attr, model);
        }
    }

    filterChanges (data) {
        if (Array.isArray(this.allow)) {
            for (const key of Object.keys(data)) {
                if (!this.allow.includes(key)) {
                    data[key] = [];
                }
            }
        }
        if (Array.isArray(this.deny)) {
            for (const key of Object.keys(data)) {
                if (this.deny.includes(key)) {
                    data[key] = [];
                }
            }
        }
    }

    async checkCounter (behavior, attr, model) {
        if (!this.required && !this.min && !this.max) {
            return;
        }
        const docs = await behavior.getLinkedDocs(attr);
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

    async checkUnique (behavior, attr, model) {
        const exist = await behavior.checkExists(attr);
        if (this.unique === true && exist === true) {
            this.addError(model, attr, this.getUniqueMessage());
        }
        if (this.unique === false && exist === false) {
            this.addError(model, attr, this.getExistMessage());
        }
    }
};