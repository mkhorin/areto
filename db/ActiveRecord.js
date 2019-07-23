/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Model');

module.exports = class ActiveRecord extends Base {

    static getConstants () {        
        return {
            TABLE: '[table_name]',
            PK: '_id', // primary key
            LINKER_CLASS: require('./ActiveLinker'),
            QUERY_CLASS: require('./ActiveQuery'),
            EVENT_AFTER_REMOVE: 'afterRemove',
            EVENT_AFTER_FIND: 'afterFind',
            EVENT_AFTER_INSERT: 'afterInsert',
            EVENT_AFTER_UPDATE: 'afterUpdate',
            EVENT_BEFORE_REMOVE: 'beforeRemove',
            EVENT_BEFORE_INSERT: 'beforeInsert',
            EVENT_BEFORE_UPDATE: 'beforeUpdate',
            // UNLINK_ON_REMOVE: [], // unlink relations after model remove
        };
    }
    
    _isNewRecord = true;
    _oldAttrMap = {};
    _related = {};

    isNew () {
        return this._isNewRecord;
    }

    isPrimaryKey (key) {
        return this.PK === key;
    }

    getDb () {
        return this.module.getDb();
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
        if (Object.prototype.hasOwnProperty.call(this._attrMap, name)) {
            return this._attrMap[name];
        }
        if (typeof name !== 'string') {
            return;
        }
        let index = name.indexOf('.');
        if (index === -1) {
            return this.rel(name);
        }
        let related = this._related[name.substring(0, index)];
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

    isChangedAttr (name) {
        return this.getOldAttr(name) !== this.get(name);
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
            const linker = this.getLinker();
            for (let relation of this.UNLINK_ON_REMOVE) {
                await linker.unlinkAll(relation);
            }
        }
        return this.trigger(this.EVENT_AFTER_REMOVE);
    }

    // POPULATE

    populateRecord (doc) {
        this._isNewRecord = false;
        Object.assign(this._attrMap, doc);
        this.assignOldAttrs();
    }

    filterAttrs () {
        let result = {};
        for (let key of this.ATTRS) {
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
        Object.assign(this._attrMap, data);
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
        let related = this._related[name];
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
        let names = [];
        for (let id of ObjectHelper.getAllFunctionNames(this)) {
            if (/^rel[A-Z]{1}/.test(id)) {
                names.push(id.substring(3));
            }
        }
        return names;
    }

    executeNestedRelationMethod (method, name, ...args) {
        if (typeof name !== 'string') {
            return;
        }
        let index = name.indexOf('.');
        if (index < 1) {
            return;
        }
        let related = this._related[name.substring(0, index)];
        name = name.substring(index + 1);
        if (related instanceof ActiveRecord) {
            return related[method](name, ...args);
        }
        if (Array.isArray(related)) {
            return related.map(item => item instanceof ActiveRecord ? item[method](name, ...args) : null);
        }
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
        delete this._related[name];
    }

    populateRelation (name, data) {
        this._related[name] = data;
    }

    getLinker () {
        if (!this._linker) {
            this._linker = new this.LINKER_CLASS({owner: this});
        }
        return this._linker;
    }

    hasOne (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).find().hasOne(this, refKey, linkKey);
    }

    hasMany (RefClass, refKey, linkKey) {
        return this.spawn(RefClass).find().hasMany(this, refKey, linkKey);
    }

    wrapMessage (message) {
        return `${this.constructor.name}: ID: ${this.getId()}: ${message}`;
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, `${this.constructor.name}: ID: ${this.getId()}`, this.module);
    }

    logError () {
        this.log('error', ...arguments);
    }
};
module.exports.init();

const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');
const PromiseHelper = require('../helper/PromiseHelper');