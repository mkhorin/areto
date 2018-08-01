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
            filter: null, // handler (value, model, attr, cb),
            behavior: 'relationChange'
        }, config));
    }

    init () {
        super.init();
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

    validateAttr (model, attr, cb) {
        let behavior = model.getBehavior(this.behavior);
        if (!behavior) {
            return cb(this.wrapClassMessage('Not found relation behavior'));
        }
        let data = behavior.getChanges(attr);
        if (data === false) {
            this.addError(model, attr, this.getMessage());
            return cb();
        }
        if (data) {
            this.filterChanges(data);
        }
        AsyncHelper.series([
            cb => data && this.filter ? this.filter(data, model, attr, cb) : cb(),
            cb => this.checkCounter(behavior, model, attr, cb),
            cb => this.unique !== null ? this.checkUnique(behavior, model, attr, cb) : cb()
        ], cb);
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

    checkCounter (behavior, model, attr, cb) {
        if (!this.required && !this.min && !this.max) {
            return cb();
        }
        AsyncHelper.waterfall([
            cb => behavior.getLinkedDocs(attr, cb),
            (docs, cb) => {
                if (this.required && docs.length < 1) {
                    this.addError(model, attr, this.getRequiredMessage());
                }
                if (this.min && docs.length < this.min) {
                    this.addError(model, attr, this.getTooFewMessage());
                }
                if (this.max && docs.length > this.max) {
                    this.addError(model, attr, this.getTooManyMessage());
                }
                cb();
            }
        ], cb);
    }

    checkUnique (behavior, model, attr, cb) {
        AsyncHelper.waterfall([
            cb => behavior.checkExist(attr, cb),
            (exist, cb)=> {
                if (this.unique === true && exist === true) {
                    this.addError(model, attr, this.getUniqueMessage());
                }
                if (this.unique === false && exist === false) {
                    this.addError(model, attr, this.getExistMessage());
                }
                cb();
            }
        ], cb);
    }
};

const AsyncHelper = require('../helper/AsyncHelper');