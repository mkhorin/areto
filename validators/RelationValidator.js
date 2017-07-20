'use strict';

const Base = require('./Validator');

module.exports = class RelationValidator extends Base {

    static getConstants () {
        return {
            CHANGES: ['links', 'unlinks', 'removes']
        };
    }

    constructor (config) {
        super(Object.assign({
            allow: null, // allow changes ['unlinks', ...]
            deny: null,
            filter: null // handler (value, model, attr, cb)
        }, config));
    }

    init () {
        super.init();
        if (this.allow && this.deny) {
            throw new Error(`${this.constructor.name}: Allowed only one permission`);
        }
        this.createMessage('message', 'Invalid relation request');
    }

    validateAttr (model, attr, cb) {
        this.validateValue(model.get(attr), (err, message, params, changes)=> {
            if (err) {
                return cb(err);
            }
            if (message) {
                this.addError(model, attr, message, params);
                return cb();
            }
            model.set(attr, changes);
            this.filter ? this.filter(changes, model, attr, cb) : cb();
        });
    }

    validateValue (value, cb) {
        let error = false;
        if (!value) {
            return cb(null, null, value);
        }
        value = typeof value === 'string' ? MainHelper.parseJson(value) : value;
        if (!value) {
            return cb(null, this.message);
        }
        this.filterChanges(value);
        if (this.isIntersection(value)) {
            return cb(null, this.message);
        }
        cb(null, null, null, value);
    }

    isIntersection (changes) {
        for (let link of changes.links) {
            if (changes.unlinks.includes(link) || changes.removes.includes(link)) {
                return true;
            }
        }
        return false;
    }

    filterChanges (changes) {
        for (let type of this.CHANGES) {
            if (!(changes[type] instanceof Array)) {
                changes[type] = [];
            }
        }
        if (this.allow) {
            for (let type of this.CHANGES) {
                if (!this.allow.includes(type)) {
                    changes[type] = [];
                }
            }
        }
        if (this.deny) {
            for (let type of this.CHANGES) {
                if (this.deny.includes(type)) {
                    changes[type] = [];
                }
            }
        }
    }
};
module.exports.init();

const MainHelper = require('../helpers/MainHelper');