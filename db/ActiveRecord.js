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

    static getDb () {
        return this.module.getDb();
    }

    constructor (config) {
        super(config);
        this._isNewRecord = true;
        this._oldAttrs = {};
        this._related = {};
    }

    getDb () {
        return this.constructor.getDb();
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
        return this.getId();
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
            return this._related[name];
        }
        let rel = this._related[name.substring(0, index)];
        let nested = name.substring(index + 1);
        if (rel instanceof ActiveRecord) {
            return rel.get(nested);
        }
        if (rel instanceof Array) {
            return rel.map(item => item instanceof ActiveRecord
                ? item.get(nested)
                : item ? item[nested] : item);
        }
        return rel ? rel[nested] : rel;
    }

    isAttrChanged (name) {
        return this.getOldAttr(name) !== this.get(name);
    }
    
    getOldAttr (name) {
        return Object.prototype.hasOwnProperty.call(this._oldAttrs, name) ? this._oldAttrs[name] : undefined;
    }       
    
    assignOldAttrs () {
        this._oldAttrs = Object.assign({}, this._attrs);            
    }

    // EVENTS

    afterFind (cb) {
        this.triggerCallback(this.EVENT_AFTER_FIND, cb);
    }

    beforeSave (insert, cb) {
        this.triggerCallback(insert ? this.EVENT_BEFORE_INSERT : this.EVENT_BEFORE_UPDATE, cb);
    }

    afterSave (insert, cb) {
        this.assignOldAttrs();
        this.triggerCallback(insert ? this.EVENT_AFTER_INSERT : this.EVENT_AFTER_UPDATE, cb); 
    }

    beforeRemove (cb) {
        this.triggerCallback(this.EVENT_BEFORE_REMOVE, cb);
    }

    afterRemove (cb) {
        AsyncHelper.eachSeries(this.UNLINK_ON_REMOVE, this.unlinkAll.bind(this), ()=> {
            this.triggerCallback(this.EVENT_AFTER_REMOVE, cb);
        });
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

    static find (condition) {
        return (new this.QUERY_CLASS({
            model: new this
        })).and(condition);
    }

    static findById (id) {
        return this.find(['ID', this.PK, id instanceof ActiveRecord ? id.getId() : id]);
    }

    find () {
        return this.constructor.find.apply(this.constructor, arguments);
    }

    findById (id) {
        return this.constructor.findById(id === undefined ? this.getId() : id);
    }

    // SAVE

    save (cb) {
        AsyncHelper.waterfall([
            cb => this.validate(cb),
            (model, cb)=> this.hasError()
                ? cb(null, this)
                : this.forceSave(cb)
        ], cb);
    }

    forceSave (cb) {
        this._isNewRecord ? this.insert(cb) : this.update(cb);
    }

    insert (cb) {
        AsyncHelper.series([
            cb => this.beforeSave(true, cb),
            cb => AsyncHelper.waterfall([
                cb => this.constructor.find().insert(this.filterAttrs(), cb),
                (id, cb)=> {
                    this.set(this.PK, id);
                    this._isNewRecord = false;
                    cb();
                }
            ], cb),
            cb => this.afterSave(true, cb)
        ], err => cb(err, this));
    }

    update (cb) {
        AsyncHelper.series([
            cb => this.beforeSave(false, cb),
            cb => this.findById().update(this.filterAttrs(), cb),
            cb => this.afterSave(false, cb)
        ], err => cb(err, this));
    }

    /**
     * will not perform data validation and will not trigger events
     */
    updateAttrs (cb, attrs) {
        Object.assign(this._attrs, attrs);
        this.findById().update(this.filterAttrs(), cb);
    }

    // REMOVE

    static removeBatch (models, cb) {
        let counter = 0;
        AsyncHelper.eachSeries(models, (model, cb)=> {
            model.remove(err => {
                counter += err ? 0 : 1;
                setImmediate(cb);
            });
        }, err => cb(null, counter));
    }

    static removeById (id, cb) {
        AsyncHelper.waterfall([
            cb => this.findById(id).all(cb),
            (models, cb)=> this.removeBatch(models, cb)
        ], cb);
    }

    remove (cb) {
        AsyncHelper.series([
            cb => this.beforeRemove(cb),
            cb => this.findById().remove(cb),
            cb => this.afterRemove(cb)
        ], err => cb(err));
    }

    // RELATIONS

    static findRelation (models, name, cb, renew) {
        AsyncHelper.mapSeries(models, (model, cb)=> model.findRelation(name, cb, renew), cb);
    }

    static findRelations (models, names, cb, renew) {
        AsyncHelper.mapSeries(models, (model, cb)=> model.findRelations(names, cb, renew), cb);
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
        if (rel instanceof Array) {
            return rel.map(item => item instanceof ActiveRecord ? item.rel(nestedName) : null);
        }
        return undefined;
    }

    findRelation (name, cb, renew) {
        let index = name.indexOf('.');
        if (index === -1) {
            return this.findRelationOnly(name, cb, renew);
        }
        let nestedName = name.substring(index + 1);
        AsyncHelper.waterfall([
            cb => this.findRelationOnly(name.substring(0, index), cb, renew),
            (result, cb)=> {
                if (result instanceof ActiveRecord) {
                    return result.findRelation(nestedName, cb, renew);
                }
                if (!(result instanceof Array)) {
                    return cb(null, result);
                }
                result = result.filter(model => model instanceof ActiveRecord);
                AsyncHelper.mapSeries(result, (model, cb)=> {
                    model.findRelation(nestedName, cb, renew);
                }, (err, result)=> {
                    cb(err, ArrayHelper.concatValues(result));
                });
            }
        ], cb);
    }

    findRelationOnly (name, cb, renew) {
        if (this.isRelationPopulated(name) && !renew) {
            return cb(null, this._related[name]);
        }
        let relation = this.getRelation(name);
        if (relation) {
            return relation.findFor((err, result)=> {
                this.populateRelation(name, result);
                setImmediate(()=> cb(err, this._related[name]));
            });
        }
        relation === null
            ? cb(this.wrapMessage(`Unknown relation: ${name}`))
            : cb(null, null);
    }

    findRelations (names, cb, renew) {
        AsyncHelper.mapSeries(names, (name, cb)=> this.findRelation(name, cb, renew), cb);
    }

    handleEachRelationModel (names, handler, cb) {
        AsyncHelper.waterfall([
            cb => this.findRelations(names, cb),
            (relations, cb)=> AsyncHelper.eachSeries(ArrayHelper.concatValues(relations), handler, cb)
        ], cb);
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
        return RefClass.find().hasOne(this, refKey, linkKey);
    }

    hasMany (RefClass, refKey, linkKey) {
        return RefClass.find().hasMany(this, refKey, linkKey);
    }

    // LINK

    linkViaModel (rel, targets, cb, model) {
        if (!model) {
            model = new rel._viaRelation.model.constructor;
        } else if (!(model instanceof rel._viaRelation.model.constructor)) {
            return cb(this.wrapMessage('linkViaModel: Invalid link model'));
        }
        model.set(rel.linkKey, this.get(rel.refKey));
        model.set(rel._viaRelation.refKey, this.get(rel._viaRelation.linkKey));
        model.save(cb);
    }

    link (name, model, cb, extraColumns) {
        let rel = this.getRelation(name);
        let link = (rel._viaRelation || rel._viaTable) ? this.linkVia : this.linkInline;
        link.call(this, rel, model, extraColumns, err => {
            if (err) {
                return cb(err);
            }
            if (!rel._multiple) {
                this._related[name] = model; // update lazily loaded related objects
            } else if (this.isRelationPopulated(name)) {
                if (rel._index) {
                    this._related[name][model._index] = model;
                } else {
                    this._related[name].push(model);
                }
            }
            setImmediate(()=> cb(null, this));
        });
    }

    linkVia (rel, model, extraColumns, cb) {
        let via = rel._viaTable || rel._viaRelation;
        let columns = {
            [via.refKey]: this.get(via.linkKey),
            [rel.linkKey]: model.get(rel.refKey)                
        };        
        if (extraColumns) {
            Object.assign(columns, extraColumns);
        }
        if (rel._viaTable) {
            return this.getDb().insert(via._from, columns, cb);
        }
        // unset rel so that it can be reloaded to reflect the change
        this.unsetRelation(rel._viaRelationName);
        let viaModel = new via.model.constructor;
        viaModel.assignAttrs(columns);
        viaModel.insert(cb);
    }

    linkInline (rel, model, extraColumns, cb) {
        rel.isBackRef()
            ? this.bindModels(rel.refKey, rel.linkKey, model, this, cb, rel)
            : this.bindModels(rel.linkKey, rel.refKey, this, model, cb, rel);
    }

    unlink (name, model, cb, remove) {
        let rel = this.getRelation(name);
        if (remove === undefined) {
            remove = rel._removeOnUnlink;
        }
        let unlink = (rel._viaTable || rel._viaRelation) ? this.unlinkVia : this.unlinkInline;
        unlink.call(this, rel, model, remove, ()=> {
            this.unsetUnlinked(name, model, rel);
            setImmediate(()=> cb(null, this));
        });
    }

    unsetUnlinked (name, model, rel) {
        if (!rel.isMultiple()) {
            return this.unsetRelation(name);
        }
        if (this._related[name] instanceof Array) {
            for (let i = this._related[name].length - 1; i >= 0; --i) {
                if (MongoHelper.isEqual(model.getId(), this._related[name][i].getId())) {
                    this._related[name].splice(i, 1);
                }
            }
        }
    }

    unlinkVia (rel, model, remove, cb) {
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
            remove ? this.getDb().remove(via._from, condition, cb)
                   : this.getDb().update(via._from, condition, nulls, cb);
        } else {
            this.unsetRelation(rel._viaRelationName);
            remove ? via.model.find(condition).remove(cb)
                   : via.model.find(condition).updateAll(nulls, cb);
        }
    }

    unlinkInline (rel, model, remove, cb) {
        let ref = model.get(rel.refKey);
        let link = this.get(rel.linkKey);
        if (rel.isBackRef()) {             
            if (ref instanceof Array) {
                let index = MongoHelper.indexOf(link, ref);
                if (index !== -1) {
                    ref.splice(index, 1);
                }
            } else {
                model.set(rel.refKey, null);
            }
            return remove ? model.remove(cb) : model.forceSave(cb);
        }
        if (link instanceof Array) {
            let index = MongoHelper.indexOf(ref, link);
            if (index !== -1) {
                link.splice(index, 1);
            }
        } else {
            this.set(rel.linkKey, null);
        }
        remove ? this.remove(cb) : this.forceSave(cb);
    }

    unlinkAll (name, cb, remove) {
        let rel = this.getRelation(name);
        if (!rel) {
            return cb();
        }
        if (remove === undefined) {
            remove = rel._removeOnUnlink;
        }
        let unlink = (rel._viaRelation || rel._viaTable) ? this.unlinkViaAll : this.unlinkInlineAll;
        unlink.call(this, rel, remove, err => {
            this.unsetRelation(name);
            cb(err);
        });
    }

    unlinkViaAll (rel, remove, cb) {
        let via = rel._viaTable || rel._viaRelation;
        if (rel._viaRelation) {
            this.unsetRelation(rel._viaRelationName);
        }
        let condition = {[via.refKey]: this.get(via.linkKey)};
        let nulls = {[via.refKey]: null};
        if (via._where) {
            condition = ['AND', condition, via._where];
        }
        if (!(rel.remove instanceof Array)) {
            condition = this.getDb().buildCondition(condition);
            remove ? this.getDb().remove(via._from, condition, cb)
                   : this.getDb().update(via._from, condition, nulls, cb);
        } else if (remove) {
            via.model.find(condition).all((err, models)=> {
                err ? cb(err) : AsyncHelper.eachSeries(models, (model, cb)=> model.remove(cb), cb);
            });
        } else {
            via.model.find(condition).updateAll(nulls, cb);
        }
    }

    unlinkInlineAll (rel, remove, cb) {
        // rel via array valued attr
        if (!remove && this.get(rel.linkKey) instanceof Array) { 
            this.set(rel.linkKey, []);
            return this.forceSave(cb);
        }
        let nulls = {[rel.refKey]: null};
        let condition = {[rel.refKey]: this.get(rel.linkKey)};
        if (rel._where) {
            condition = ['AND', condition, rel._where];
        }
        if (remove) {
            rel.all((err, models)=> {
                err ? cb(err) : AsyncHelper.eachSeries(models, (model, cb)=> model.remove(cb), cb);
            });
        } else if (rel._viaArray) {
            rel.model.getDb().updateAllPull(rel.model.TABLE, {}, condition, cb);
        } else {
            rel.model.find(condition).updateAll(nulls, cb);
        }
    }

    bindModels (foreignKey, primaryKey, foreignModel, primaryModel, cb, rel) {
        let value = primaryModel.get(primaryKey);
        if (!value) {
            return cb(this.wrapMessage('bindModels: primary key is null'));
        }
        if (!rel._viaArray) {
            foreignModel.set(foreignKey, value);
            return foreignModel.forceSave(cb);
        }
        if (!(foreignModel.get(foreignKey) instanceof Array)) {
            foreignModel.set(foreignKey, []);
        }
        if (MongoHelper.indexOf(value, foreignModel.get(foreignKey)) === -1) {
            foreignModel.get(foreignKey).push(value);
            return foreignModel.forceSave(cb);
        }
        cb(); // value is already exists
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

const AsyncHelper = require('../helper/AsyncHelper');
const ArrayHelper = require('../helper/ArrayHelper');
const CommonHelper = require('../helper/CommonHelper');
const MongoHelper = require('../helper/MongoHelper');
const ObjectHelper = require('../helper/ObjectHelper');
const StringHelper = require('../helper/StringHelper');