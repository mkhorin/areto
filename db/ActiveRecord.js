'use strict';

const Base = require('../base/Model');

module.exports = class ActiveRecord extends Base {

    static getConstants () {        
        return {
            TABLE: 'table_name',
            PK: '_id', // primary key name
            QUERY_CLASS: require('./ActiveQuery'),            
            //UNLINK_ON_REMOVE: [], // unlink relations after model remove
            EVENT_AFTER_REMOVE: 'afterRemove',
            EVENT_AFTER_FIND: 'afterFind',
            EVENT_AFTER_INSERT: 'afterInsert',
            EVENT_AFTER_UPDATE: 'afterUpdate',
            EVENT_BEFORE_REMOVE: 'beforeRemove',
            EVENT_BEFORE_INSERT: 'beforeInsert',
            EVENT_BEFORE_UPDATE: 'beforeUpdate'
        };
    }

    static getDb() {
        return this.module.getDb();
    }

    init () {
        super.init();
        this._isNewRecord = true;
        this._oldAttrs = {};
        this._related = {};
    }

    getDb () {
        return this.module.getDb();
    }

    isNew () {
        return this._isNewRecord;
    }

    isPk (key) {
        return this.PK === key;
    }

    getId () {
        return this.get(this.PK);
    }

    getTitle () {
        return this.get(this.PK);
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
        let nestedName = name.substring(index + 1);
        if (rel instanceof ActiveRecord) {
            return rel.get(nestedName);
        }
        if (rel instanceof Array) {
            return rel.map(item => {
                return item instanceof ActiveRecord? item.get(nestedName) : item ? item[nestedName] : item;
            });
        }
        return rel ? rel[nestedName] : rel;
    }

    isAttrChanged (name) {
        return this.getOldAttr(name) !== this.get(name);
    }
    
    getOldAttr (name) {
        return this._oldAttrs[name];
    }       
    
    setOldAttrs () {
        this._oldAttrs = Object.assign({}, this._attrs);            
    }

    // EVENTS

    beforeRemove (cb) {
        this.triggerCallback(this.EVENT_BEFORE_REMOVE, cb);
    }

    beforeSave (insert, cb) {
        this.triggerCallback(insert ? this.EVENT_BEFORE_INSERT : this.EVENT_BEFORE_UPDATE, cb);
    }

    afterFind (cb) {
        this.triggerCallback(this.EVENT_AFTER_FIND, cb);
    }

    afterSave (insert, cb) {
        this.setOldAttrs();
        this.triggerCallback(insert ? this.EVENT_AFTER_INSERT : this.EVENT_AFTER_UPDATE, cb); 
    }

    afterRemove (cb) {
        if (!(this.UNLINK_ON_REMOVE instanceof Array)) {
            return this.triggerCallback(this.EVENT_AFTER_REMOVE, cb);
        }
        async.eachSeries(this.UNLINK_ON_REMOVE, this.unlinkAll.bind(this), ()=> {
            this.triggerCallback(this.EVENT_AFTER_REMOVE, cb);
        });
    }

    // POPULATE

    populateRecord (doc) {
        this._isNewRecord = false;
        Object.assign(this._attrs, doc);
        this.setOldAttrs();
    }

    filterAttrs () {
        let attrs = {};
        for (let key of this.STORED_ATTRS) {
            if (Object.prototype.hasOwnProperty.call(this._attrs, key)) {
                attrs[key] = this._attrs[key];    
            }
        }
        return attrs;
    }

    // FIND

    static find (condition) {
        return (new this.QUERY_CLASS(new this)).where(condition);
    }

    static findById (id) {
        return this.find(['ID', this.PK, id]);
    }

    find () {
        return this.constructor.find.apply(this.constructor, arguments);
    }

    findById (id) {
        return this.constructor.findById(id === undefined ? this.getId() : id);
    }

    // SAVE

    static updateAll (attrs, condition, cb) {
        this.getDb().updateAll(this.TABLE, this.getDb().buildCondition(condition), attrs, cb);
    }

    save (cb) {
        this.validate(err => {
            err ? cb(err) : this.hasError() ? cb() : this.forceSave(cb);
        });
    }

    forceSave (cb) {
        this._isNewRecord ? this.insert(cb) : this.update(cb);
    }

    insert (cb) {
        async.series([
            cb => this.beforeSave(true, cb),
            cb => async.waterfall([
                cb => this.constructor.find().insert(this.filterAttrs(), cb),
                (id, cb)=> {
                    this.set(this.PK, id);
                    this._isNewRecord = false;
                    cb();
                }
            ], cb),
            cb => this.afterSave(true, cb)
        ], err => cb(err)); // clear async results
    }

    update (cb) {
        async.series([
            cb => this.beforeSave(false, cb),
            cb => this.findById().update(this.filterAttrs(), cb),
            cb => this.afterSave(false, cb)
        ], err => cb(err)); // clear async results
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
        async.eachSeries(models, (model, cb)=> {
            model.remove(()=> cb()); // to process all removal requests, ignoring errors
        }, cb);
    }

    static removeAll (condition, cb) {
        this.getDb().remove(this.TABLE, this.getDb().buildCondition(condition), cb);
    }

    static removeById (id, cb) {
        this.findById(id).all((err, models)=> {
            err ? cb(err) : this.removeBatch(models, cb);
        });
    }

    remove (cb) {
        async.series([
            this.beforeRemove.bind(this),
            cb => this.findById().remove(cb),
            this.afterRemove.bind(this)
        ], err => cb(err)); // clear async results
    }

    // RELATIONS

    static findRelation (models, name, cb, renew) {
        async.mapSeries(models, (model, cb)=> model.findRelation(name, cb, renew), cb);
    }

    static findRelations (models, names, cb, renew) {
        async.mapSeries(models, (model, cb)=> model.findRelations(names, cb, renew), cb);
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

    getRelatedRecords () {
        return this._related;
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
        return this._related[name];
    }

    rel (name) {
        if (Object.prototype.hasOwnProperty.call(this._related, name)) {
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
        if (Object.prototype.hasOwnProperty.call(this._related, name) && !renew) {
            return cb(null, this._related[name]);
        }
        let relation = this.getRelation(name);
        if (relation) {
            relation.findFor((err, result)=> {
                this.populateRelation(name, result);
                cb(err, this._related[name]);
            });
        } else if (relation === null) {
            cb(`${this.constructor.name}: Relation '${name}' not found`);
        } else {
            cb(null, null);
        }
    }

    findRelations (names, cb, renew) {
        async.mapSeries(names, (name, cb)=> this.findRelation(name, cb, renew), cb);
    }

    unsetRelation (name) {
        if (Object.prototype.hasOwnProperty.call(this._related, name)) {
            delete this._related[name];
        }
    }

    populateRelation (name, records) {
        this._related[name] = records;
    }

    hasOne (ModelClass, link) {
        return ModelClass.find().hasOne(this, link);
    }

    hasMany (ModelClass, link) {
        return ModelClass.find().hasMany(this, link);
    }

    // LINK

    linkViaModel (relation, targets, cb, linkModel) {
        let viaRelation = relation._via[1];
        if (!linkModel) {
            linkModel = new viaRelation.model.constructor;
        } else if (!(linkModel instanceof viaRelation.model.constructor)) {
            cb(`${this.constructor.name}: linkViaModel: Invalid link model`);
        }
        linkModel.set(relation._link[1], this.get(relation._link[0]));
        linkModel.set(viaRelation._link[0], this.get(viaRelation._link[1]));
        linkModel.save(err => cb(err, linkModel));
    }

    link (name, model, cb, extraColumns) {
        let relation = this.getRelation(name);
        let link = relation._via ? this.linkVia : this.linkInline;
        link.call(this, relation, model, extraColumns, err => {
            if (err) {
                return cb(err);
            }
            if (!relation._multiple) {
                this._related[name] = model; // update lazily loaded related objects
            } else if (this.isRelationPopulated(name)) {
                if (relation._index) {
                    this._related[name][model._index] = model;
                } else {
                    this._related[name].push(model);
                }
            }
            cb();
        });
    }

    linkVia (relation, model, extraColumns, cb) {
        let viaName, viaRelation, viaModel, viaTable;
        if (relation._via instanceof Array) {
            viaName = relation._via[0];
            viaRelation = relation._via[1]; // @var viaRelation ActiveQuery
            viaModel = viaRelation.model;
            this.unsetRelation(viaName); // unset $viaName so that it can be reloaded to reflect the change
        } else {
            viaRelation = relation._via;
            viaTable = viaRelation._from;
        }
        let columns = {
            [viaRelation._link[0]]: this.get(viaRelation._link[1]),
            [relation._link[1]]: model.get(relation._link[0])                
        };        
        if (extraColumns) {
            Object.assign(columns, extraColumns);
        }
        if (relation._via instanceof Array) {
            let record = new viaModel.constructor;
            record._attrs = columns;
            record.insert(cb);
        } else {
            this.getDb().insert(viaTable, columns, cb);
        }
    }

    linkInline (relation, model, extraColumns, cb) {
        let a = relation._link[0];
        let b = relation._link[1];
        let asBackRef = relation._asBackRef;
        (asBackRef === undefined ? (this.isPk(b) || !this.STORED_ATTRS.includes(b)) : asBackRef)
            ? this.bindModels(relation._link, model, this, cb, relation)
            : this.bindModels([b, a], this, model, cb, relation);
    }

    unlink (name, model, cb, remove) {
        let relation = this.getRelation(name);
        if (remove === undefined) {
            remove = relation._removeOnUnlink;
        }
        let unlink = relation._via ? this.unlinkVia : this.unlinkInline;
        unlink.call(this, relation, model, remove, ()=> {
            if (!relation.isMultiple()) {
                this.unsetRelation(name);
            } else if (this.isRelationPopulated(name)) {
                for (let i = this._related[name].length - 1; i >= 0; --i) {
                    if (MainHelper.isEqual(model.getId(), this._related[name][i].getId())) {
                        this._related[name].splice(i, 1);
                    }
                }
            }
            cb();
        });
    }

    unlinkVia (relation, model, remove, cb) {
        let viaName, viaRelation, viaModel, viaTable;
        if (relation._via instanceof Array) {
            viaName = relation._via[0];
            viaRelation = relation._via[1]; // @var viaRelation ActiveQuery
            viaModel = viaRelation.model;
            this.unsetRelation(viaName);
        } else {
            viaRelation = relation._via;
            viaTable = viaRelation._from;
        }
        let columns = {
            [viaRelation._link[0]]: this.get(viaRelation._link[1]),
            [relation._link[1]]: model.get(relation._link[0])
        };
        let nulls = {
            [viaRelation._link[0]]: null,
            [relation._link[1]]: null
        };
        if (remove === undefined) {
            remove = viaRelation._removeOnUnlink;
        }
        if (relation._via instanceof Array) {
            remove ? viaModel.constructor.removeAll(columns, cb)
                : viaModel.constructor.updateAll(nulls, columns, cb);
        } else {
            remove ? this.getDb().remove(viaTable, columns, cb)
                : this.getDb().update(viaTable, columns, nulls, cb);
        }
    }

    unlinkInline (relation, model, remove, cb) {
        let a = relation._link[0];
        let b = relation._link[1];
        let asBackRef = relation._asBackRef;
        if (asBackRef === undefined ? (this.isPk(b) || !this.STORED_ATTRS.includes(b)) : asBackRef) {
            if (model.get(a) instanceof Array) {
                let index = MainHelper.indexOfId(this.get(b), model.get(a));
                if (index !== -1) {
                    model.get(a).splice(index, 1);
                }
            } else {
                model.set(a, null);
            }
            remove ? model.remove(cb) : model.forceSave(cb);
        } else {
            if (this.get(b) instanceof Array) {
                let index = MainHelper.indexOfId(model.get(a), this.get(b));
                if (index !== -1) {
                    this.get(b).splice(index, 1);
                }
            } else {
                this.set(b, null);
            }
            remove ? this.remove(cb) : this.forceSave(cb);
        }
    }

    unlinkAll (name, cb, remove) {
        let relation = this.getRelation(name);
        if (!relation) {
            return cb();
        }
        if (remove === undefined) {
            remove = relation._removeOnUnlink;
        }
        let unlink = relation._via ? this.unlinkViaAll : this.unlinkInlineAll;
        unlink.call(this, relation, remove, err => {
            this.unsetRelation(name);
            cb(err);
        });
    }

    unlinkViaAll (relation, remove, cb) {
        let viaName, viaRelation, viaModel, viaTable;
        if (relation._via instanceof Array) {
            viaName = relation._via[0];
            viaRelation = relation._via[1]; // @var viaRelation ActiveQuery
            viaModel = viaRelation.model;
            this.unsetRelation(viaName);
        } else {
            viaRelation = relation._via;
            viaTable = viaRelation._from;
        }
        let condition = {
            [viaRelation._link[0]]: this.get(viaRelation._link[1])
        };
        let nulls = {
            [viaRelation._link[0]]: null
        };
        if (viaRelation._where) {
            condition = ['AND', condition, viaRelation._where];
        }
        if (relation.remove instanceof Array) {
            if (remove) {
                viaModel.constructor.find(condition).all((err, models)=> {
                    err ? cb(err) : async.eachSeries(models, (model, cb)=> model.remove(cb), cb);
                });
            } else {
                viaModel.constructor.updateAll(nulls, condition, cb);
            }
        } else {
            condition = this.getDb().buildCondition(condition);
            remove ? this.getDb().remove(viaTable, condition, cb)
                : this.getDb().update(viaTable, condition, nulls, cb);
        }
    }

    unlinkInlineAll (relation, remove, cb) {
        let model = relation.model;
        let a = relation._link[0];
        let b = relation._link[1];
        if (!remove && this.get(b) instanceof Array) { // relation via array valued attr
            this.set(b, []);
            return this.forceSave(cb);
        }
        let nulls = {[a]: null};
        let condition = {[a]: this.get(b)};
        if (relation._where) {
            condition = ['AND', condition, relation._where];
        }
        if (remove) {
            relation.all((err, models)=> {
                err ? cb(err) : async.eachSeries(models, (model, cb)=> model.remove(cb), cb);
            });
        } else if (relation._viaArray) {
            model.getDb().updateAllPull(model.TABLE, {}, condition, cb);
        } else {
            model.constructor.updateAll(nulls, condition, cb);
        }
    }

    bindModels (link, foreignModel, primaryModel, cb, relation) {
        let fk = link[0];
        let pk = link[1];
        let value = primaryModel.get(pk);
        if (!value) {
            return cb(`${this.constructor.name}: bindModels: PK is null`);
        }
        if (!relation._viaArray) {
            foreignModel.set(fk, value);
            return foreignModel.forceSave(cb);
        }
        if (!(foreignModel.get(fk) instanceof Array)) {
            foreignModel.set(fk, []);
        }
        if (MainHelper.indexOfId(value, foreignModel.get(fk)) === -1) {
            foreignModel.get(fk).push(value);
            return foreignModel.forceSave(cb);
        }
        cb(); // value is exists already
    }

    // HANDLER

    getHandler (name) {
        if (typeof name === 'string') {
            name = `handler${StringHelper.toFirstUpperCase(name)}`;
            if (typeof this[name] === 'function') {
                return this[name];
            }
        }
        return null;
    }
};
module.exports.init();

const async = require('async');
const MainHelper = require('../helpers/MainHelper');
const ObjectHelper = require('../helpers/ObjectHelper');
const StringHelper = require('../helpers/StringHelper');