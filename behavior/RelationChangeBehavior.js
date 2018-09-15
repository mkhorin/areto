/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
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

    beforeValidate () {
        return this.resolveChanges();
    }

    beforeSave () {
        return this.resolveChanges();
    }

    async afterSave () {
        for (let key of Object.keys(this._changes)) {
            await this.changeRelations(this._changes[key], key);
        }
    }

    getChanges (name) {
        return Object.prototype.hasOwnProperty.call(this._changes, name)
            ? this._changes[name] : null;
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
        for (let name of this.getActiveRelationNames()) {
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

    async resolveTypeChanges (type, attr) {
        if (this._changes[attr][type].length) {
            let rel = this.getRelation(attr);
            this._changes[attr][type] = await rel.model.findById(this._changes[attr][type]).all();
        }
    }

    async changeRelations (data, name) {
        if (!data) {
            return;
        }
        delete this._changes[name];
        if (data.removes instanceof Array) {
            for (let model of data.removes) {
                await model.remove();
            }
        }
        if (data.unlinks instanceof Array) {
            for (let model of data.unlinks) {
                await this.owner.unlink(name, model);
            }
        }
        if (data.links instanceof Array) {
            for (let model of data.links) {
                await this.owner.link(name, model);
            }
        }
        await PromiseHelper.setImmediate();
    }

    async getLinkedDocs (name) {
        if (this._linkedDocs !== undefined) {
            return this._linkedDocs;
        }
        let relation = this.getRelation(name);
        let docs = await relation.asRaw().all();
        let map = {};
        docs.forEach(doc => map[doc[relation.model.PK]] = doc);
        let data = this._changes[name];
        if (data) {
            data.links.forEach(model => map[model.getId()] = model.getAttrs());
            data.unlinks.concat(data.removes).forEach(model => delete map[model.getId()]);
        }
        return this._linkedDocs = Object.values(map);
    }

    // EXIST

    async checkExist (name) {
        let rel = this.getRelation(name);
        if (rel.isMultiple()) {
            throw new Error(this.wrapClassMessage(`Multiple relation to exist: ${name}`));
        }
        let docs = await this.getLinkedDocs(name);
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
        let ids = await this.owner.find({
            [rel.linkKey]: doc[rel.refKey]
        }).limit(2).column(this.owner.PK);
        return this.checkExistId(this.owner.getId(), ids);
    }

    async checkBackRefExist (rel, doc) {
        let ids = await rel.model.find({
            [rel.refKey]: this.owner.get(rel.linkAttr)
        }).limit(2).column(rel.model.PK);
        return this.checkExistId(doc[rel.model.PK], ids);
    }

    checkExistId (id, ids) {
        return ids.length === 0
            ? false : ids.length === 1
                ? !MongoHelper.isEqual(id, ids[0]) : true;
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const MongoHelper = require('../helper/MongoHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const ActiveRecord = require('../db/ActiveRecord');
const Validator = require('../validator/Validator');