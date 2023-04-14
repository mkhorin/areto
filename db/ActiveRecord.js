/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Model');

module.exports = class ActiveRecord extends Base {

    static getConstants () {
        return {
            // TABLE: 'tableName',
            PK: '_id', // primary key
            LINKER_CLASS: require('./ActiveLinker'),
            QUERY_CLASS: require('./ActiveQuery'),
            EVENT_BEFORE_INSERT: 'beforeInsert',
            EVENT_BEFORE_UPDATE: 'beforeUpdate',
            EVENT_BEFORE_DELETE: 'beforeDelete',
            EVENT_AFTER_INSERT: 'afterInsert',
            EVENT_AFTER_UPDATE: 'afterUpdate',
            EVENT_AFTER_DELETE: 'afterDelete',
            DELETE_ON_UNLINK: [], // delete related models after unlink or model deletion
            UNLINK_ON_DELETE: [], // unlink relations after model deletion
        };
    }

    _isNew = true;
    _oldAttrMap = {};
    _related = {};

    isId (id) {
        return !this._isNew && JSON.stringify(id) === JSON.stringify(this.getId());
    }

    isNew () {
        return this._isNew;
    }

    isPrimaryKey (key) {
        return this.PK === key;
    }

    getDb () {
        return this.db || this.module.getDb();
    }

    getTable () {
        return this.TABLE
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

    toJSON () {
        const id = this.getId();
        return id?.toJSON ? id.toJSON() : id;
    }

    // ATTRIBUTES

    isAttrChanged (name) {
        return !CommonHelper.isEqual(this._attrMap[name], this._oldAttrMap[name]);
    }

    get (name) {
        if (Object.hasOwn(this._attrMap, name)) {
            return this._attrMap[name];
        }
        if (typeof name !== 'string') {
            return;
        }
        const index = name.indexOf('.');
        if (index === -1) {
            return this.rel(name);
        }
        const related = this.getRelated(name.substring(0, index));
        if (!related) {
            return;
        }
        name = name.substring(index + 1);
        if (!Array.isArray(related)) {
            return ObjectHelper.getValueFromGetterFirst(name, related);
        }
        const result = [];
        for (const item of related) {
            result.push(ObjectHelper.getValueFromGetterFirst(name, item));
        }
        return result;
    }

    getOldAttr (name) {
        if (Object.hasOwn(this._oldAttrMap, name)) {
            return this._oldAttrMap[name];
        }
    }

    assignOldAttrs () {
        this._oldAttrMap = {...this._attrMap};
    }

    // EVENTS

    beforeSave (insert) {
        // call on override: await super.beforeSave(insert)
        return insert ? this.beforeInsert() : this.beforeUpdate();
    }

    beforeInsert () {
        // call on override: await super.beforeInsert()
        return this.trigger(this.EVENT_BEFORE_INSERT);
    }

    beforeUpdate () {
        // call on override: await super.beforeUpdate()
        return this.trigger(this.EVENT_BEFORE_UPDATE);
    }

    afterSave (insert) {
        // call on override: await super.afterSave(insert)
        return insert ? this.afterInsert() : this.afterUpdate();
    }

    afterInsert () {
        // call on override: await super.afterInsert()
        return this.trigger(this.EVENT_AFTER_INSERT);
    }

    afterUpdate () {
        // call on override: await super.afterUpdate()
        return this.trigger(this.EVENT_AFTER_UPDATE);
    }

    beforeDelete () {
        // call await super.beforeDelete() if override it
        return this.trigger(this.EVENT_BEFORE_DELETE);
    }

    async afterDelete () {
        // call on override: await super.afterDelete()
        await this.unlinkRelations(this.getUnlinkOnDelete());
        await this.deleteRelatedModels(this.getDeleteOnUnlink());
        return this.trigger(this.EVENT_AFTER_DELETE);
    }

    // POPULATE

    populate (doc) {
        this._isNew = false;
        Object.assign(this._attrMap, doc);
        this.assignOldAttrs();
    }

    filterAttrs () {
        const result = {};
        for (const key of this.ATTRS) {
            if (Object.hasOwn(this._attrMap, key)) {
                result[key] = this._attrMap[key];
            }
        }
        return result;
    }

    // FIND

    findById (id) {
        return this.find(['id', this.PK, id]);
    }

    findSelf () {
        return this.find({[this.PK]: this.getId()});
    }

    find () {
        return this.createQuery().and(...arguments);
    }

    createQuery () {
        return new this.QUERY_CLASS({model: this});
    }

    // SAVE

    async save () {
        if (await this.validate()) {
            await this.forceSave();
            return true;
        }
    }

    forceSave () {
        return this._isNew ? this.insert() : this.update();
    }

    async insert () {
        await this.beforeSave(true);
        const data = this.filterAttrs();
        const id = await this.createQuery().insert(data);
        this.set(this.PK, id);
        this._isNew = false;
        await this.afterSave(true);
        this.assignOldAttrs();
    }

    async update () {
        await this.beforeSave(false);
        const data = this.filterAttrs();
        await this.findSelf().update(data);
        await this.afterSave(false);
        this.assignOldAttrs();
    }

    // skip before and after save triggers
    async directUpdate (data) {
        this.assign(data);
        data = this.filterAttrs();
        await this.findSelf().update(data);
        this.assignOldAttrs();
    }

    // DELETE

    static async delete (models) {
        for (const model of models) {
            await model.delete();
        }
    }

    async delete () {
        await this.beforeDelete();
        if (!this.hasError()) {
            await this.findSelf().delete();
            await this.afterDelete();
            await PromiseHelper.setImmediate();
        }
    }

    // RELATIONS

    static async resolveRelation (name, models) {
        const relations = [];
        for (const model of models) {
            const result = await model.resolveRelation(name);
            relations.push(result);
        }
        return relations;
    }

    static async resolveRelations (names, models) {
        const relations = [];
        for (const model of models) {
            const result = await model.resolveRelations(names);
            relations.push(result);
        }
        return relations;
    }

    rel (name) {
        return this.isRelationPopulated(name)
            ? this._related[name]
            : this.executeRelatedMethod('rel', name);
    }

    call (name, ...args) {
        return typeof this[name] === 'function'
            ? this[name](...args)
            : this.executeRelatedMethod('call', name, ...args);
    }

    isRelationPopulated (name) {
        return Object.hasOwn(this._related, name);
    }

    getRelated (name) {
        return this.isRelationPopulated(name) ? this._related[name] : undefined;
    }

    setRelatedViewAttr (name) {
        this.setViewAttr(name, this.getRelatedTitle(name));
    }

    getRelatedTitle (name) {
        if (!this.isRelationPopulated(name)) {
            return this.executeRelatedMethod('getRelatedTitle', name) || this.get(name);
        }
        const related = this._related[name];
        if (!Array.isArray(related)) {
            return related ? related.getTitle() : this.get(name);
        }
        const titles = [];
        for (const model of related) {
            const title = typeof model?.getTitle === 'function'
                ? model.getTitle()
                : null;
            titles.push(title);
        }
        return titles;
    }

    getAllRelationNames () {
        const pattern = new RegExp('^rel[A-Z]{1}');
        const names = [];
        for (const name of ObjectHelper.getAllFunctionNames(this)) {
            if (pattern.test(name)) {
                names.push(name.substring(3));
            }
        }
        return names;
    }

    getRelation (name) {
        return name ? this['rel' + StringHelper.capitalize(name)]?.() : null;
    }

    hasMany (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).createQuery().relateMany(this, refKey, linkKey);
    }

    hasOne (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).createQuery().relateOne(this, refKey, linkKey);
    }

    executeRelatedMethod (method, name, ...args) {
        if (typeof name !== 'string') {
            return;
        }
        const index = name.indexOf('.');
        if (index < 1) {
            return;
        }
        const related = this.getRelated(name.substring(0, index));
        if (!related) {
            return;
        }
        name = name.substring(index + 1);
        if (!Array.isArray(related)) {
            return typeof related[method] === 'function'
                ? related[method](name, ...args)
                : undefined;
        }
        const models = [];
        for (const model of related) {
            models.push(typeof model?.[method] === 'function'
                ? model[method](name, ...args)
                : null);
        }
        return models;
    }

    populateRelation (name, data) {
        this._related[name] = data;
    }

    async resolveRelation (name) {
        const index = name.indexOf('.');
        if (index === -1) {
            return this.resolveOneRelation(name);
        }
        let nestedName = name.substring(index + 1);
        let result = await this.resolveOneRelation(name.substring(0, index));
        if (!result) {
            return result;
        }
        if (typeof result.resolveRelation === 'function') {
            return result.resolveRelation(nestedName);
        }
        if (!Array.isArray(result)) {
            return result;
        }
        const models = [];
        for (const model of result) {
            if (typeof model?.resolveRelation === 'function') {
                const items = await model.resolveRelation(nestedName);
                models.push(items);
            }
        }
        return ArrayHelper.concat(models);
    }

    async resolveOneRelation (name) {
        if (this.isRelationPopulated(name)) {
            return this._related[name];
        }
        const relation = this.getRelation(name);
        if (relation) {
            this.populateRelation(name, await relation.resolve());
            await PromiseHelper.setImmediate();
            return this._related[name];
        }
        if (relation === null) {
            throw new Error(this.wrapMessage(`Unknown relation: ${name}`));
        }
        return null;
    }

    async resolveRelations (names) {
        const result = [];
        for (const name of names) {
            const data = await this.resolveRelation(name);
            result.push(data);
        }
        return result;
    }

    async handleEachRelatedModel (names, handler) {
        const models = await this.resolveRelations(names);
        for (const model of ArrayHelper.concat(models)) {
            if (model) {
                await handler(model);
            }
        }
    }

    unsetRelated (name) {
        if (Array.isArray(name)) {
            for (const key of name) {
                delete this._related[key];
            }
        } else if (!arguments.length) {
            this._related = {};
        }
        delete this._related[name];
    }

    getLinker () {
        if (!this._linker) {
            this._linker = this.spawn(this.LINKER_CLASS, {owner: this});
        }
        return this._linker;
    }

    getUnlinkOnDelete () {
        return this.UNLINK_ON_DELETE;
    }

    async unlinkRelations (relations) {
        for (const relation of relations) {
            await this.getLinker().unlinkAll(relation);
        }
    }

    getDeleteOnUnlink () {
        return this.DELETE_ON_UNLINK;
    }

    async deleteRelatedModels (relations) {
        for (const relation of relations) {
            const result = await this.resolveOneRelation(relation);
            if (Array.isArray(result)) {
                for (const model of result) {
                    if (model instanceof ActiveRecord) {
                        await model.delete();
                    }
                }
            } else if (result instanceof ActiveRecord) {
                await result.delete();
            }
        }
    }

    log () {
        CommonHelper.log(this.module, this.toString(), ...arguments);
    }

    wrapMessage (message) {
        return `${this.toString()}: ${message}`;
    }
};
module.exports.init();

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const PromiseHelper = require('../helper/PromiseHelper');