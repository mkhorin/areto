'use strict';

const Base = require('../base/Behavior');

module.exports = class RelationChangeBehavior extends Base {

    constructor (config) {
        super(config);        
        this._changes = {};
        this._relations = {};        
        this.assign(ActiveRecord.EVENT_BEFORE_VALIDATE, this.beforeValidate);
        this.assign(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeSave);
        this.assign(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeSave);
        this.assign(ActiveRecord.EVENT_AFTER_INSERT, this.afterSave);
        this.assign(ActiveRecord.EVENT_AFTER_UPDATE, this.afterSave);
    }

    beforeValidate (cb) {
        this.resolveChanges(cb);
    }

    beforeSave (cb) {
        this.resolveChanges(cb);
    }

    afterSave (cb, event) {
        AsyncHelper.eachOfSeries(this._changes, this.changeRelations.bind(this), cb);
    }

    getChanges (name) {
        return this._changes.hasOwnProperty(name) ? this._changes[name] : null;
    }

    getRelation (name) {
        if (!this._relations.hasOwnProperty(name)) {
            this._relations[name] = this.owner.getRelation(name);
        }
        return this._relations[name];
    }

    resolveChanges (cb) {
        if (this._resolved) {
            return cb();
        }
        this._resolved = true;
        AsyncHelper.eachSeries(this.getActiveRelationNames(), (name, cb)=> {
            this._changes[name] = CommonHelper.parseRelationChanges(this.owner.get(name));
            this.restoreValue(name);
            this._changes[name] ? AsyncHelper.series([
                this.resolveTypeChanges.bind(this, 'links', name),
                this.resolveTypeChanges.bind(this, 'unlinks', name),
                this.resolveTypeChanges.bind(this, 'removes', name)
            ], cb) : cb();
        }, cb);
    }

    getActiveRelationNames () {
        let names = [];
        for (let item of this.owner.getValidators()) {
            if (item instanceof Validator.BUILTIN.relation && item.isActive(this.owner.scenario)) {
                names = names.concat(item.attrs);
            }
        }
        return ArrayHelper.unique(names);
    }

    restoreValue (name) {
        let value = this.owner.getOldAttr(name);
        if (value !== undefined) {
            return this.owner.set(name, value);
        }
        let rel = this.getRelation(name);
        this.owner.set(name, rel.isInlineArray() ? [] : null);
    }

    resolveTypeChanges (type, attr, cb) {
        if (!this._changes[attr][type].length) {
            return cb();
        }
        let rel = this.getRelation(attr);
        AsyncHelper.waterfall([
            cb => rel.model.findById(this._changes[attr][type]).all(cb),
            (models, cb)=> {
                this._changes[attr][type] = models;
                cb();
            }
        ], cb);
    }

    changeRelations (data, name, cb) {
        if (!data) {
            return cb();
        }
        delete this._changes[name];
        AsyncHelper.series([
            cb => AsyncHelper.eachSeries(data.removes, (model, cb)=> {
                model.remove(cb);
            }, cb),
            cb => AsyncHelper.eachSeries(data.unlinks, (model, cb)=> {
                this.owner.unlink(name, model, cb);
            }, cb),
            cb => AsyncHelper.eachSeries(data.links, (model, cb)=> {
                this.owner.link(name, model, cb);
            }, cb),
            cb => setImmediate(cb)
        ], cb);
    }

    getLinkedDocs (name, cb) {
        if (this._linkedDocs !== undefined) {
            return cb(null, this._linkedDocs);
        }
        let relation = this.getRelation(name);
        AsyncHelper.waterfall([
            cb => relation.asRaw().all(cb),
            (docs, cb) => {
                let data = this._changes[name], map = {};
                docs.forEach(doc => map[doc[relation.model.PK]] = doc);
                if (data) {
                    data.links.forEach(model => map[model.getId()] = model.getAttrs());
                    data.unlinks.concat(data.removes).forEach(model => delete map[model.getId()]);
                }
                cb(null, this._linkedDocs = Object.values(map));
            }
        ], cb);
    }

    // EXIST

    checkExist (name, cb) {
        let rel = this.getRelation(name);
        if (rel.isMultiple()) {
            return cb(this.wrapClassMessage(`Multiple relation to exist: ${name}`))
        }
        AsyncHelper.waterfall([
            cb => this.getLinkedDocs(name, cb),
            (docs, cb)=> {
                if (docs.length === 0) {
                    return cb(null, null);
                }
                if (docs.length !== 1) {
                    return cb(this.wrapClassMessage('Invalid relation changes'));
                }
                rel.isBackRef()
                    ? this.checkBackRefExist(rel, docs[0], cb)
                    : this.checkRefExist(rel, docs[0], cb);
            }
        ], cb);
    }

    checkRefExist (rel, doc, cb) {
        AsyncHelper.waterfall([
            cb => this.owner.find({[rel.linkKey]: doc[rel.refKey]}).limit(2).column(this.owner.PK, cb),
            (ids, cb)=> cb(null, this.checkExistId(this.owner.getId(), ids))
        ], cb);
    }

    checkBackRefExist (rel, doc, cb) {
        AsyncHelper.waterfall([
            cb => rel.model.find({[rel.refKey]: this.owner.get(rel.linkAttr)}).limit(2).column(rel.model.PK, cb),
            (ids, cb)=> cb(null, this.checkExistId(doc[rel.model.PK], ids))
        ], cb);
    }

    checkExistId (id, ids) {
        return ids.length === 0 ? false : ids.length === 1 ? !MongoHelper.isEqual(id, ids[0]) : true;
    }
};

const AsyncHelper = require('../helper/AsyncHelper');
const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const MongoHelper = require('../helper/MongoHelper');
const ActiveRecord = require('../db/ActiveRecord');
const Validator = require('../validator/Validator');