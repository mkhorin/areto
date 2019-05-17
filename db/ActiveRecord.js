/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Model');

module.exports = class ActiveRecord extends Base {

    static getConstants () {        
        return {
            TABLE: 'table_name',
            PK: '_id', // primary key
            QUERY_CLASS: require('./ActiveQuery'),
            EVENT_AFTER_REMOVE: 'afterRemove',
            EVENT_AFTER_FIND: 'afterFind',
            EVENT_AFTER_INSERT: 'afterInsert',
            EVENT_AFTER_UPDATE: 'afterUpdate',
            EVENT_BEFORE_REMOVE: 'beforeRemove',
            EVENT_BEFORE_INSERT: 'beforeInsert',
            EVENT_BEFORE_UPDATE: 'beforeUpdate',
            //UNLINK_ON_REMOVE: [], // unlink relations after model remove
        };
    }
    
    _isNewRecord = true;
    _oldAttrs = {};
    _related = {};

    getDb () {
        return this.module.getDb();
    }

    isNew () {
        return this._isNewRecord;
    }

    isPrimaryKey (key) {
        return this.PK === key;
    }

    getId () {
        return this.get(this.PK);
    }

    getTitle () {
        return String(this.getId());
    }

    toString () {
        return `${this.constructor.name}: ${this.getId()}`;
    }

    // ATTRIBUTES

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrs, name)) {
            return this._attrs[name];
        }
        if (typeof name !== 'string') {
            return undefined;
        }
        let index = name.indexOf('.');
        if (index === -1) {
            return this.rel(name);
        }
        let rel = this._related[name.substring(0, index)];
        let nested = name.substring(index + 1);
        if (rel instanceof ActiveRecord) {
            return rel.get(nested);
        }
        if (Array.isArray(rel)) {
            return rel.map(item => item instanceof ActiveRecord
                ? item.get(nested)
                : item ? item[nested] : item
            );
        }
        return rel ? rel[nested] : rel;
    }

    isChangedAttr (name) {
        return this.getOldAttr(name) !== this.get(name);
    }
    
    getOldAttr (name) {
        if (Object.prototype.hasOwnProperty.call(this._oldAttrs, name)) {
            return this._oldAttrs[name];
        }
    }       
    
    assignOldAttrs () {
        this._oldAttrs = {...this._attrs};
    }

    // EVENTS

    afterFind () {
        // call await super.afterFind() if override this method
        return this.trigger(this.EVENT_AFTER_FIND);
    }

    beforeSave (insert) {
        // call await super.beforeSave(insert) if override this method
        return insert ? this.beforeInsert() : this.beforeUpdate();
    }

    beforeInsert () {
        // call await super.beforeInsert() if override this method
        return this.trigger(this.EVENT_BEFORE_INSERT);
    }

    beforeUpdate () {
        // call await super.beforeUpdate() if override this method
        return this.trigger(this.EVENT_BEFORE_UPDATE);
    }

    afterSave (insert) {
        // call await super.afterSave(insert) if override this method
        return insert ? this.afterInsert() : this.afterUpdate();
    }

    afterInsert () {
        // call await super.afterInsert() if override this method
        return this.trigger(this.EVENT_AFTER_INSERT);
    }

    afterUpdate () {
        // call await super.afterUpdate() if override this method
        return this.trigger(this.EVENT_AFTER_UPDATE);
    }

    beforeRemove () {
        // call await super.beforeRemove() if override this method
        return this.trigger(this.EVENT_BEFORE_REMOVE);
    }

    async afterRemove () {
        // call await super.afterRemove() if override this method
        if (Array.isArray(this.UNLINK_ON_REMOVE)) {
            for (let relation of this.UNLINK_ON_REMOVE) {
                await this.unlinkAll(relation);
            }
        }
        return this.trigger(this.EVENT_AFTER_REMOVE);
    }

    // POPULATE

    populateRecord (doc) {
        this._isNewRecord = false;
        Object.assign(this._attrs, doc);
        this.assignOldAttrs();
    }

    filterAttrs () {
        let attrs = {};
        for (let key of this.ATTRS) {
            if (Object.prototype.hasOwnProperty.call(this._attrs, key)) {
                attrs[key] = this._attrs[key];    
            }
        }
        return attrs;
    }

    // FIND
    
    findById (id) {
        return this.find(['ID', this.PK, id === undefined ? this.getId() : id]);
    }

    find (condition) {
        return (new this.QUERY_CLASS({model: this})).and(condition);
    }

    // SAVE

    async save () {
        if (await this.validate()) {
            await this.forceSave();
            return true;
        }
    }

    forceSave () {
        return this._isNewRecord ? this.insert() : this.update();
    }

    async insert () {
        await this.beforeSave(true);
        this.set(this.PK, await this.find().insert(this.filterAttrs()));
        this._isNewRecord = false;
        await this.afterSave(true);
        this.assignOldAttrs();
    }

    async update () {
        await this.beforeSave(false);
        await this.findById().update(this.filterAttrs());
        await this.afterSave(false);
        this.assignOldAttrs();
    }

    /**
     * will not perform data validation and will not trigger events
     */
    directUpdate (data) {
        Object.assign(this._attrs, data);
        return this.findById().update(this.filterAttrs());
    }

    // REMOVE

    static async remove (models) {
        for (let model of models) {
            await model.remove();
            await PromiseHelper.setImmediate();
        }
    }
    
    static async removeBatch (models) {
        let counter = 0;
        for (let model of models) {
            try {
                await model.remove();
                counter += 1;
            } catch (err) {
                model.log('error', 'removeBatch', err);
            }
            await PromiseHelper.setImmediate();
        }
        return counter;
    }

    async remove () {
        await this.beforeRemove();
        await this.findById().remove();
        await this.afterRemove();
    }

    // RELATIONS

    static async findRelation (name, models, renew) {
        let relations = [];
        for (let model of models) {
            relations.push(await model.findRelation(name, renew));
        }
        return relations;
    }

    static async findRelations (names, models, renew) {
        let relations = [];
        for (let model of models) {
            relations.push(await model.findRelations(names, renew));
        }
        return relations;
    }

    getAllRelationNames () {
        let names = [];
        for (let id of ObjectHelper.getAllFunctionNames(this)) {
            if (/^rel[A-Z]{1}/.test(id)) {
                names.push(id.substring(3));
            }
        }
        return names;
    }

    getRelation (name) {
        if (!name || typeof name !== 'string') {
            return null;
        }
        name = `rel${StringHelper.toFirstUpperCase(name)}`;
        return this[name] ? this[name]() : null;
    }

    isRelationPopulated (name) {
        return Object.prototype.hasOwnProperty.call(this._related, name);
    }
    
    getPopulatedRelation (name) {
        return this.isRelationPopulated(name) ? this._related[name] : null;
    }

    rel (name) {
        if (this.isRelationPopulated(name)) {
            return this._related[name];
        }
        if (typeof name !== 'string') {
            return undefined;
        }
        let index = name.indexOf('.');
        if (index < 1) {
            return undefined;
        }
        let rel = this._related[name.substring(0, index)];
        let nestedName = name.substring(index + 1);
        if (rel instanceof ActiveRecord) {
            return rel.rel(nestedName);
        }
        if (Array.isArray(rel)) {
            return rel.map(item => item instanceof ActiveRecord ? item.rel(nestedName) : null);
        }
        return undefined;
    }

    async findRelation (name, renew) {
        let index = name.indexOf('.');
        if (index === -1) {
            return this.findRelationOnly(name, renew);
        }
        let nestedName = name.substring(index + 1);
        let result = await this.findRelationOnly(name.substring(0, index), renew);
        if (result instanceof ActiveRecord) {
            return result.findRelation(nestedName, renew);
        }
        if (!Array.isArray(result)) {
            return result;
        }
        result = result.filter(model => model instanceof ActiveRecord);
        let models = [];
        for (let model of result) {
            models.push(await model.findRelation(nestedName, renew));
        }
        return ArrayHelper.concatValues(models);
    }

    async findRelationOnly (name, renew) {
        if (this.isRelationPopulated(name) && !renew) {
            return this._related[name];
        }
        let relation = this.getRelation(name);
        if (relation) {
            this.populateRelation(name, await relation.findFor());
            await PromiseHelper.setImmediate();
            return this._related[name];
        }
        if (relation === null) {
            throw new Error(this.wrapMessage(`Unknown relation: ${name}`));
        }
        return null;
    }

    async findRelations (names, renew) {
        let relations = [];
        for (let name of names) {
            relations.push(await this.findRelation(name, renew));
        }
        return relations;
    }

    async handleEachRelationModel (names, handler) {
        let relations = await this.findRelations(names);
        for (let model of ArrayHelper.concatValues(relations)) {
            await handler(model);
        }
    }

    unsetRelation (name) {
        if (this.isRelationPopulated(name)) {
            delete this._related[name];
        }
    }

    populateRelation (name, data) {
        this._related[name] = data;
    }

    hasOne (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).find().hasOne(this, refKey, linkKey);
    }

    hasMany (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).find().hasMany(this, refKey, linkKey);
    }

    // LINK

    linkViaModel (rel, targets, model) {
        if (!model) {
            model = this.spawn(rel._viaRelation.model.constructor);
        } else if (!(model instanceof rel._viaRelation.model.constructor)) {
            throw new Error(this.wrapMessage('linkViaModel: Invalid link model'));
        }
        model.set(rel.linkKey, this.get(rel.refKey));
        model.set(rel._viaRelation.refKey, this.get(rel._viaRelation.linkKey));
        return model.save();
    }

    async link (name, model, extraColumns) {
        let rel = this.getRelation(name);
        let link = (rel._viaRelation || rel._viaTable) ? this.linkVia : this.linkInner;
        await link.call(this, rel, model, extraColumns);
        if (!rel._multiple) {
            this._related[name] = model; // update lazily loaded related objects
        } else if (this.isRelationPopulated(name)) {
            if (rel._index) {
                this._related[name][model._index] = model;
            } else {
                this._related[name].push(model);
            }
        }
        await PromiseHelper.setImmediate();
    }

    linkVia (rel, model, extraColumns) {
        let via = rel._viaTable || rel._viaRelation;
        let columns = {
            [via.refKey]: this.get(via.linkKey),
            [rel.linkKey]: model.get(rel.refKey)                
        };        
        if (extraColumns) {
            Object.assign(columns, extraColumns);
        }
        if (rel._viaTable) {
            return this.getDb().insert(via._from, columns);
        }
        // unset rel so that it can be reloaded to reflect the change
        this.unsetRelation(rel._viaRelationName);
        let viaModel = this.spawn(via.model.constructor);
        viaModel.assignAttrs(columns);
        return viaModel.insert();
    }

    linkInner (rel, model, extraColumns) {
        return rel.isBackRef()
            ? this.bindModels(rel.refKey, rel.linkKey, model, this, rel)
            : this.bindModels(rel.linkKey, rel.refKey, this, model, rel);
    }

    async unlink (name, model, remove) {
        let rel = this.getRelation(name);
        if (remove === undefined) {
            remove = rel._removeOnUnlink;
        }
        let unlink = (rel._viaTable || rel._viaRelation) ? this.unlinkVia : this.unlinkInner;
        await unlink.call(this, rel, model, remove);
        this.unsetUnlinked(name, model, rel);
        await PromiseHelper.setImmediate();
    }

    unsetUnlinked (name, model, rel) {
        if (!rel.isMultiple()) {
            return this.unsetRelation(name);
        }
        if (Array.isArray(this._related[name])) {
            for (let i = this._related[name].length - 1; i >= 0; --i) {
                if (MongoHelper.isEqual(model.getId(), this._related[name][i].getId())) {
                    this._related[name].splice(i, 1);
                }
            }
        }
    }

    unlinkVia (rel, model, remove) {
        let via = rel._viaTable || rel._viaRelation;
        let condition = {
            [via.refKey]: this.get(via.linkKey),
            [rel.linkKey]: model.get(rel.refKey)
        };
        let nulls = {
            [via.refKey]: null,
            [rel.linkKey]: null
        };
        if (remove === undefined) {
            remove = via._removeOnUnlink;
        }
        if (rel._viaTable) {
            return remove ? this.getDb().remove(via._from, condition)
                          : this.getDb().update(via._from, condition, nulls);
        }
        this.unsetRelation(rel._viaRelationName);
        return remove ? via.model.find(condition).remove()
                      : via.model.find(condition).updateAll(nulls);
    }

    async unlinkInner (rel, model, remove) {
        let ref = model.get(rel.refKey);
        let link = this.get(rel.linkKey);
        rel.isBackRef()
            ? await QueryHelper.unlinkInner(ref, link, model, rel.refKey)
            : await QueryHelper.unlinkInner(link, ref, this, rel.linkKey);
        return remove ? model.remove() : null;
    }

    async unlinkAll (name, remove) {
        let rel = this.getRelation(name);
        if (!rel) {
            return false;
        }
        if (remove === undefined) {
            remove = rel._removeOnUnlink;
        }
        let unlink = (rel._viaRelation || rel._viaTable) ? this.unlinkViaAll : this.unlinkInnerAll;
        await unlink.call(this, rel, remove);
        this.unsetRelation(name);
    }

    async unlinkViaAll (rel, remove) {
        let via = rel._viaTable || rel._viaRelation;
        if (rel._viaRelation) {
            this.unsetRelation(rel._viaRelationName);
        }
        let condition = {[via.refKey]: this.get(via.linkKey)};
        let nulls = {[via.refKey]: null};
        if (via._where) {
            condition = ['AND', condition, via._where];
        }
        if (!Array.isArray(rel.remove)) {
            condition = this.getDb().buildCondition(condition);
            remove ? await this.getDb().remove(via._from, condition)
                   : await this.getDb().update(via._from, condition, nulls);
        } else if (remove) {
            for (let model of await via.model.find(condition).all()) {
                await model.remove();
            }
        } else {
            await via.model.find(condition).updateAll(nulls);
        }
    }

    async unlinkInnerAll (rel, remove) {
        // rel via array valued attr
        if (!remove && Array.isArray(this.get(rel.linkKey))) { 
            this.set(rel.linkKey, []);
            return this.forceSave();
        }
        let nulls = {[rel.refKey]: null};
        let condition = {[rel.refKey]: this.get(rel.linkKey)};
        if (rel._where) {
            condition = ['AND', condition, rel._where];
        }
        if (remove) {
            for (let model of await rel.all()) {
                await model.remove();
            }
        } else if (rel._viaArray) {
            await rel.model.getDb().updateAllPull(rel.model.TABLE, {}, condition);
        } else {
            await rel.model.find(condition).updateAll(nulls);
        }
    }

    bindModels (foreignKey, primaryKey, foreignModel, primaryModel, rel) {
        let value = primaryModel.get(primaryKey);
        if (!value) {
            throw new Error(this.wrapMessage('bindModels: primary key is null'));
        }
        if (!rel._viaArray) {
            foreignModel.set(foreignKey, value);
            return foreignModel.forceSave();
        }
        if (!Array.isArray(foreignModel.get(foreignKey))) {
            foreignModel.set(foreignKey, []);
        }
        if (MongoHelper.indexOf(value, foreignModel.get(foreignKey)) === -1) {
            foreignModel.get(foreignKey).push(value);
            return foreignModel.forceSave();
        }
        return Promise.resolve(); // value is already exists
    }

    getHandler (name) {
        if (typeof name === 'string') {
            name = `handler${StringHelper.toFirstUpperCase(name)}`;
            if (typeof this[name] === 'function') {
                return this[name];
            }
        }
        return null;
    }

    wrapMessage (message) {
        return `${this.constructor.name}: ID: ${this.getId()}: ${message}`;
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, `${this.constructor.name}: ID: ${this.getId()}`, this.module);
    }
};
module.exports.init();

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const MongoHelper = require('../helper/MongoHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const QueryHelper = require('../helper/QueryHelper');