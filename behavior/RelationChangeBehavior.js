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
            this._changes[name] = CommonHelper.parseRelationChanges(this.owner.get(name));
            this.restoreValue(name);
            if (this._changes[name]) {
                await this.resolveTypeChanges('links', name);
                await this.resolveTypeChanges('unlinks', name);
                await this.resolveTypeChanges('removes', name);
            }
        }
    }

    getActiveRelationNames () {
        let names = [];
        for (const item of this.owner.getValidators()) {
            if (item instanceof Validator.BUILTIN.relation && item.isActive(this.owner.scenario)) {
                names = names.concat(item.attrs);
            }
        }
        return ArrayHelper.unique(names);
    }

    restoreValue (name) {
        const value = this.owner.getOldAttr(name);
        if (value !== undefined) {
            return this.owner.set(name, value);
        }
        const rel = this.getRelation(name);
        this.owner.set(name, rel.isInternalArray() ? [] : null);
    }

    async resolveTypeChanges (type, attr) {
        if (this._changes[attr][type].length) {
            const rel = this.getRelation(attr);
            this._changes[attr][type] = await rel.model.findById(this._changes[attr][type]).all();
        }
    }

    async changeRelations (data, name) {
        if (!data) {
            return;
        }
        delete this._changes[name];
        if (Array.isArray(data.removes)) {
            for (const model of data.removes) {
                await model.remove();
            }
        }
        if (Array.isArray(data.unlinks)) {
            for (const model of data.unlinks) {
                await this.owner.getLinker().unlink(name, model);
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
        const map = {};
        for (const doc of docs) {
            map[doc[relation.model.PK]] = doc;
        }
        const data = this._changes[name];
        if (data) {
            for (const model of data.links) {
                map[model.getId()] = model.getAttrMap();
            }
            for (const model of data.unlinks.concat(data.removes)) {
                delete map[model.getId()];
            }
        }
        this._linkedDocs = Object.values(map);
        return this._linkedDocs;
    }

    // EXISTs

    async checkExists (name) {
        const rel = this.getRelation(name);
        if (rel.isMultiple()) {
            throw new Error(this.wrapClassMessage(`Multiple relation cannot be checked for exist: ${name}`));
        }
        const docs = await this.getLinkedDocs(name);
        if (docs.length === 0) {
            return null;
        }
        if (docs.length !== 1) {
            throw new Error(this.wrapClassMessage('Invalid relation changes'));
        }
        return rel.isBackRef()
            ? await this.checkBackRefExist(rel, docs[0])
            : await this.checkRefExist(rel, docs[0]);
    }

    async checkRefExist (rel, doc) {
        const ids = await this.owner.find({[rel.linkKey]: doc[rel.refKey]}).limit(2).ids();
        return this.isExistingId(this.owner.getId(), ids);
    }

    async checkBackRefExist (rel, doc) {
        const ids = await rel.model.find({[rel.refKey]: this.owner.get(rel.linkAttr)}).limit(2).ids();
        return this.isExistingId(doc[rel.model.PK], ids);
    }

    isExistingId (id, ids) {
        return ids.length === 1 ? !CommonHelper.isEqual(id, ids[0]) : ids.length > 1;
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const ActiveRecord = require('../db/ActiveRecord');
const Validator = require('../validator/Validator');