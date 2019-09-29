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
            EVENT_BEFORE_REMOVE: 'beforeRemove',
            EVENT_AFTER_INSERT: 'afterInsert',
            EVENT_AFTER_UPDATE: 'afterUpdate',
            EVENT_AFTER_REMOVE: 'afterRemove',
            // UNLINK_ON_REMOVE: [], // unlink relations after model remove
        };
    }

    _isNew = true;
    _oldAttrMap = {};
    _related = {};

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

    // ATTRIBUTES

    isAttrChanged (name) {
        return !CommonHelper.isEqual(this._attrMap[name], this._oldAttrMap[name]);
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrMap, name)) {
            return this._attrMap[name];
        }
        if (typeof name !== 'string') {
            return;
        }
        const index = name.indexOf('.');
        if (index === -1) {
            return this.rel(name);
        }
        const related = this._related[name.substring(0, index)];
        name = name.substring(index + 1);
        if (related instanceof ActiveRecord) {
            return related.get(name);
        }
        if (Array.isArray(related)) {
            return related.map(item => item instanceof ActiveRecord
                ? item.get(name)
                : item ? item[name] : item
            );
        }
        return related ? related[name] : related;
    }
    
    getOldAttr (name) {
        if (Object.prototype.hasOwnProperty.call(this._oldAttrMap, name)) {
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

    beforeRemove () {
        // call await super.beforeRemove() if override it
        return this.trigger(this.EVENT_BEFORE_REMOVE);
    }

    async afterRemove () {
        // call on override: await super.afterRemove()
        if (Array.isArray(this.UNLINK_ON_REMOVE)) {
            const linker = this.getLinker();
            for (const relation of this.UNLINK_ON_REMOVE) {
                await linker.unlinkAll(relation);
            }
        }
        return this.trigger(this.EVENT_AFTER_REMOVE);
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
            if (Object.prototype.hasOwnProperty.call(this._attrMap, key)) {
                result[key] = this._attrMap[key];
            }
        }
        return result;
    }

    // FIND

    findById (id) {
        return this.find(['ID', this.PK, id === undefined ? this.getId() : id]);
    }

    find () {
        return (new this.QUERY_CLASS({model: this})).and(...arguments);
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
        this.set(this.PK, await this.find().insert(this.filterAttrs()));
        this._isNew = false;
        await this.afterSave(true);
        this.assignOldAttrs();
    }

    async update () {
        await this.beforeSave(false);
        await this.findById().update(this.filterAttrs());
        await this.afterSave(false);
        this.assignOldAttrs();
    }

    // skip before and after save triggers
    async directUpdate (data) {
        this.assignAttrs(data);
        await this.findById().update(this.filterAttrs());
        this.assignOldAttrs();
    }

    // REMOVE

    static async remove (models) {
        for (const model of models) {
            await model.remove();
            await PromiseHelper.setImmediate();
        }
    }

    async remove () {
        await this.beforeRemove();
        await this.findById().remove();
        await this.afterRemove();
    }

    // RELATIONS

    static async resolveRelation (name, models) {
        const relations = [];
        for (const model of models) {
            relations.push(await model.resolveRelation(name));
        }
        return relations;
    }

    static async resolveRelations (names, models) {
        const relations = [];
        for (const model of models) {
            relations.push(await model.resolveRelations(names));
        }
        return relations;
    }

    rel (name) {
        return this.isRelationPopulated(name)
            ? this._related[name]
            : this.executeNestedRelationMethod('rel', name);
    }

    call (name, ...args) {
        return typeof this[name] === 'function'
            ? this[name](...args)
            : this.executeNestedRelationMethod('call', name, ...args);
    }

    setViewRelation (name) {
        this.setViewAttr(name, this.getRelationTitle(name));
    }

    isRelationPopulated (name) {
        return Object.prototype.hasOwnProperty.call(this._related, name);
    }

    getRelationTitle (name) {
        if (!this.isRelationPopulated(name)) {
            return this.executeNestedRelationMethod('getRelationTitle', name) || this.get(name);
        }
        const related = this._related[name];
        return Array.isArray(related)
            ? related.map(model => model instanceof ActiveRecord ? model.getTitle() : null)
            : related ? related.getTitle() : this.get(name);
    }

    getRelation (name) {
        if (!name || typeof name !== 'string') {
            return null;
        }
        name = 'rel' + StringHelper.toFirstUpperCase(name);
        return this[name] ? this[name]() : null;
    }

    getPopulatedRelation (name) {
        return this.isRelationPopulated(name) ? this._related[name] : null;
    }

    getAllRelationNames () {
        const names = [];
        const pattern = new RegExp('^rel[A-Z]{1}');
        for (const name of ObjectHelper.getAllFunctionNames(this)) {
            if (pattern.test(name)) {
                names.push(name.substring(3));
            }
        }
        return names;
    }

    executeNestedRelationMethod (method, name, ...args) {
        if (typeof name !== 'string') {
            return;
        }
        const index = name.indexOf('.');
        if (index < 1) {
            return;
        }
        const related = this._related[name.substring(0, index)];
        name = name.substring(index + 1);
        if (related instanceof ActiveRecord) {
            return related[method](name, ...args);
        }
        if (Array.isArray(related)) {
            return related.map(item => item instanceof ActiveRecord ? item[method](name, ...args) : null);
        }
    }

    async resolveRelation (name) {
        const index = name.indexOf('.');
        if (index === -1) {
            return this.resolveRelationOnly(name);
        }
        let nestedName = name.substring(index + 1);
        let result = await this.resolveRelationOnly(name.substring(0, index));
        if (result instanceof ActiveRecord) {
            return result.resolveRelation(nestedName);
        }
        if (!Array.isArray(result)) {
            return result;
        }
        result = result.filter(model => model instanceof ActiveRecord);
        const models = [];
        for (const model of result) {
            models.push(await model.resolveRelation(nestedName));
        }
        return ArrayHelper.concat(models);
    }

    async resolveRelationOnly (name) {
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
            result.push(await this.resolveRelation(name));
        }
        return result;
    }

    async handleEachRelationModel (names, handler) {
        const relations = await this.resolveRelations(names);
        for (const model of ArrayHelper.concat(relations)) {
            await handler(model);
        }
    }

    unsetRelations (names) {
        if (Array.isArray(names)) {
            for (const name of names) {
                delete this._related[name];
            }
        } else {
            this._related = {};
        }
    }

    unsetRelation (name) {
        delete this._related[name];
    }

    populateRelation (name, data) {
        this._related[name] = data;
    }

    getLinker () {
        if (!this._linker) {
            this._linker = this.spawn(this.LINKER_CLASS, {owner: this});
        }
        return this._linker;
    }

    hasOne (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).find().hasOne(this, refKey, linkKey);
    }

    hasMany (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).find().hasMany(this, refKey, linkKey);
    }

    log () {
        CommonHelper.log(this.module, `${this.constructor.name}: ID: ${this.getId()}`, ...arguments);
    }

    wrapMessage (message) {
        return `${this.constructor.name}: ID: ${this.getId()}: ${message}`;
    }
};
module.exports.init();

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const PromiseHelper = require('../helper/PromiseHelper');