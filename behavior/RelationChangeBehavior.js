/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class RelationChangeBehavior extends Base {

    _changes = {};
    _relations = {};

    constructor (config) {
        super(config);
        this.setHandler(ActiveRecord.EVENT_BEFORE_VALIDATE, this.beforeValidate);
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeSave);
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeSave);
        this.setHandler(ActiveRecord.EVENT_AFTER_INSERT, this.afterSave);
        this.setHandler(ActiveRecord.EVENT_AFTER_UPDATE, this.afterSave);
    }

    beforeValidate () {
        return this.resolveChanges();
    }

    beforeSave () {
        return this.resolveChanges();
    }

    async afterSave () {
        for (const key of Object.keys(this._changes)) {
            await this.changeRelations(this._changes[key], key);
        }
    }

    getChanges (name) {
        return Object.prototype.hasOwnProperty.call(this._changes, name) ? this._changes[name] : null;
    }

    getRelation (name) {
        if (!Object.prototype.hasOwnProperty.call(this._relations, name)) {
            this._relations[name] = this.owner.getRelation(name);
        }
        return this._relations[name];
    }

    async resolveChanges () {
        if (this._resolved) {
            return;
        }
        this._resolved = true;
        for (const name of this.getActiveRelationNames()) {
            const value = this.owner.get(name);
            const oldValue = this.owner.getOldAttr(name);
            if (value && value !== oldValue) {
                this._changes[name] = CommonHelper.parseRelationChanges(value);
            }
            this.restoreValue(name, oldValue);
            if (this._changes[name]) {
                await this.resolveLinks(name);
                await this.resolveByRelated('unlinks', name);
                await this.resolveByRelated('deletes', name);
            }
        }
    }

    getActiveRelationNames () {
        let names = [];
        for (const item of this.owner.getValidators()) {
            if (item instanceof RelationValidator && item.isActive(this.owner.scenario)) {
                names = names.concat(item.attrs);
            }
        }
        return ArrayHelper.unique(names);
    }

    restoreValue (name, value) {
        if (value !== undefined) {
            return this.owner.set(name, value);
        }
        const relation = this.getRelation(name);
        this.owner.set(name, relation.isInternalArray() ? [] : null);
    }

    async resolveLinks (name) {
        const changes = this._changes[name];
        if (changes.links.length) {
            changes.links = await this.getRelation(name).model.findById(changes.links).all();
        }
    }

    async resolveByRelated (key, name) {
        const changes = this._changes[name];
        if (changes[key].length) {
            const query = this.getRelation(name);
            changes[key] = await query.and(['ID', query.model.PK, changes[key]]).all();
        }
    }

    async changeRelations (data, name) {
        if (!data) {
            return;
        }
        delete this._changes[name];
        if (Array.isArray(data.deletes)) {
            this.owner.constructor.delete(data.deletes);
        }
        if (Array.isArray(data.unlinks)) {
            if (this.owner.getDeleteOnUnlink().includes(name)) {
                this.owner.constructor.delete(data.unlinks);
            } else {
                for (const model of data.unlinks) {
                    await this.owner.getLinker().unlink(name, model);
                }
            }
        }
        if (Array.isArray(data.links)) {
            for (const model of data.links) {
                await this.owner.getLinker().link(name, model);
            }
        }
        return PromiseHelper.setImmediate();
    }

    async getLinkedDocs (name) {
        if (this._linkedDocs !== undefined) {
            return this._linkedDocs;
        }
        const relation = this.getRelation(name);
        const docs = await relation.raw().all();
        const result = {};
        for (const doc of docs) {
            result[doc[relation.model.PK]] = doc;
        }
        const data = this._changes[name];
        if (data) {
            for (const model of data.links) {
                result[model.getId()] = model.getAttrMap();
            }
            for (const model of data.unlinks.concat(data.deletes)) {
                delete result[model.getId()];
            }
        }
        this._linkedDocs = Object.values(result);
        return this._linkedDocs;
    }

    // EXISTS

    async checkExists (name) {
        const relation = this.getRelation(name);
        if (relation.isMultiple()) {
            throw new Error(`Multiple relation cannot be checked for exist: ${name}`);
        }
        const docs = await this.getLinkedDocs(name);
        if (docs.length === 0) {
            return null;
        }
        if (docs.length !== 1) {
            throw new Error('Invalid relation changes');
        }
        return relation.isBackRef()
            ? await this.checkBackRefExist(relation, docs[0])
            : await this.checkRefExist(relation, docs[0]);
    }

    async checkRefExist ({refKey, linkKey}, doc) {
        const ids = await this.owner.find({[linkKey]: doc[refKey]}).limit(2).ids();
        return this.isExistingId(this.owner.getId(), ids);
    }

    async checkBackRefExist ({model, refKey, linkAttr}, doc) {
        const ids = await model.find({[refKey]: this.owner.get(linkAttr)}).limit(2).ids();
        return this.isExistingId(doc[model.PK], ids);
    }

    isExistingId (id, ids) {
        return ids.length === 1 ? !CommonHelper.isEqual(id, ids[0]) : ids.length > 1;
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const ActiveRecord = require('../db/ActiveRecord');
const RelationValidator = require('../validator/RelationValidator');