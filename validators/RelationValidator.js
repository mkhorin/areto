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
            filter: null, // handler (value, model, attr, cb),
            min: null,
            max: null
        }, config));
    }

    init () {
        super.init();
        if (this.allow && this.deny) {
            throw new Error(`${this.constructor.name}: Allowed only one permission`);
        }
        if (this.min > 0) {
            this.createMessage('tooFew', 'Relation should contain at least {min} lnk.', {min: this.min});
        }
        if (this.max > 0) {
            this.createMessage('tooMany', 'Relation should contain at most {max} lnk.', {max: this.max});
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
            if (changes) {
                model.set(attr, changes);
            }
            if (!this.filter || !changes) {
                return this.checkTotal(changes, model, attr, cb);
            }
            async.series([
                cb => this.filter(changes, model, attr, cb),
                cb => this.checkTotal(changes, model, attr, cb)
            ], cb);
        });
    }

    validateValue (value, cb) {
        let error = false;
        value = typeof value === 'string' ? MainHelper.parseJson(value) : value;
        if (!value || (!value.links && !value.unlinks && !value.removes)) {
            return cb();
        }
        this.filterChanges(value);
        let all = value.links.concat(value.unlinks, value.removes);
        if (ArrayHelper.unique(all).length !== all.length) {
            return cb(null, this.message);
        }
        cb(null, null, null, value);
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

    checkTotal (changes, model, attr, cb) {
        this.min || this.max ? async.waterfall([
            cb => model.findRelation(attr, cb),
            (models, cb) => {
                models = models instanceof Array ? models : models ? [models] : [];
                let map = models.length ? ArrayHelper.indexModels(models, models[0].PK) : {};
                if (changes) {
                    if (changes.links instanceof Array) {
                        changes.links.forEach(id => map[id] = true);
                    }
                    if (changes.unlinks instanceof Array) {
                        changes.unlinks.forEach(id => delete map[id]);
                    }
                    if (changes.removes instanceof Array) {
                        changes.removes.forEach(id => delete map[id]);
                    }
                }
                let total = Object.keys(map).length;
                if (this.min && total < this.min) {
                    this.addError(model, attr, this.tooFew);
                }
                if (this.max && total > this.max) {
                    this.addError(model, attr, this.tooMany);
                }
                cb();
            }
        ], cb) : cb();
    }
};
module.exports.init();

const async = require('async');
const MainHelper = require('../helpers/MainHelper');
const ArrayHelper = require('../helpers/ArrayHelper');