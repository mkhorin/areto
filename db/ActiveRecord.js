'use strict';

const Base = require('../base/Model');
const MainHelper = require('../helpers/MainHelper');
const ObjectHelper = require('../helpers/ObjectHelper');
const async = require('async');

module.exports = class ActiveRecord extends Base {

    static getConstants () {        
        return {
            PK: '_id', // primary key name
            QUERY_CLASS: require('./ActiveQuery'),            
            //UNLINK_ON_REMOVE: [], // unlink relations after model remove
            EVENT_AFTER_DELETE: 'afterDelete',
            EVENT_AFTER_FIND: 'afterFind',
            EVENT_AFTER_INSERT: 'afterInsert',
            EVENT_AFTER_UPDATE: 'afterUpdate',
            EVENT_BEFORE_DELETE: 'beforeDelete',
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
    
    isPk (key) {
        return this.PK === key;
    }

    getId () {
        return this.get(this.PK);
    }

    getTitle () {
        return this.get(this.PK);
    }
    
    isNewRecord () {
        return this._isNewRecord;
    }

    // ATTRIBUTES

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._attrs, name)) {
            return this._attrs[name];
        }
        let index = name.indexOf('.');
        if (index < 0) {
            return this._related[name];
        }
        let rel = this._related[name.substring(0, index)];
        let subName = name.substring(index + 1);
        if (rel instanceof ActiveRecord) {
            return rel.get(subName);
        }
        if (rel instanceof Array) {
            return rel.map(item => item instanceof ActiveRecord ? item.get(subName) : item ? item[subName] : item);
        }
        return rel ? rel[subName] : rel;
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

    beforeDelete (cb) {
        this.triggerCallback(this.EVENT_BEFORE_DELETE, cb);
    }

    beforeSave (cb, insert) {
        this.triggerCallback(insert ? this.EVENT_BEFORE_INSERT : this.EVENT_BEFORE_UPDATE, cb);
    }

    afterFind (cb) {
        this.triggerCallback(this.EVENT_AFTER_FIND, cb);
    }

    afterSave (cb, insert) {
        this.setOldAttrs();
        this.triggerCallback(insert ? this.EVENT_AFTER_INSERT : this.EVENT_AFTER_UPDATE, cb); 
    }

    afterDelete (cb) {
        if (this.UNLINK_ON_REMOVE instanceof Array) {
            async.eachSeries(this.UNLINK_ON_REMOVE, (name, cb)=> {
                this.unlinkAll(name, cb);
            }, err => {
                this.triggerCallback(this.EVENT_AFTER_DELETE, cb);
            });
        } else {
            this.triggerCallback(this.EVENT_AFTER_DELETE, cb);
        }
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
            cb => this.beforeSave(cb, true),
            cb => {
                this.constructor.find().insert(this.filterAttrs(), (err, id)=> {
                    if (!err) {
                        this.set(this.PK, id);
                        this._isNewRecord = false;    
                    }
                    cb(err);
                });
            },
            cb => this.afterSave(cb, true)
        ], cb);
    }

    update (cb) {
        async.series([
            this.beforeSave.bind(this),
            cb => this.findById().update(this.filterAttrs(), cb),
            this.afterSave.bind(this)
        ], cb);
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
        // to process all removal requests, ignoring errors
        async.eachSeries(models, (model, cb)=> {
            model.remove(()=> cb());
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
        this.beforeDelete(err => {
            err ? cb(err) : this.findById().remove(err => {
                err ? cb(err) : this.afterDelete(cb);
            });
        });
    }

    // RELATIONS
    
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
        if (typeof name !== 'string') {
            return null;
        }
        name = `rel${name.toUpperCaseFirstLetter()}`;
        return name in this ? this[name]() : null;
    }

    isRelationPopulated (name) {
        return Object.prototype.hasOwnProperty.call(this._related, name);
    }
    
    getPopulatedRelation (name) {
        return this._related[name];
    }

    findRelation (name, cb, renew) {
        if (!(name in this._related) || renew) {
            this.getRelation(name).findFor((err, result)=> {
                this._related[name] = result;
                cb(err, result);
            });
        } else {
            cb(null, this._related[name]);
        }
    }

    findRelations (names, cb, renew) {
        async.each(names, (name, cb)=> {
            this.findRelation(name, cb, renew);
        }, cb);
    }

    unsetRelation (name) {
        if (Object.prototype.hasOwnProperty.call(this._related, name)) {
            delete this._related[name];
        }
    }

    populateRelation (name, records) {
        this._related[name] = records;
    }

    hasOne (Model, link) {
        return Model.find().hasOne(this, link);
    }

    hasMany (Model, link) {
        return Model.find().hasMany(this, link);
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
            } else if (!relation._multiple) {
                // update lazily loaded related objects
                this._related[name] = model;
            } else if (Object.prototype.hasOwnProperty.call(this._related, name)) {
                if (relation._indexBy) {
                    let indexBy = relation._indexBy;
                    this._related[name][model._indexBy] = model;
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
            if (!relation._multiple) {
                this.unsetRelation(name);
            } else if (Object.prototype.hasOwnProperty.call(this._related, name)) {
                for (let i = this._related[name].length - 1; i >= 0; --i) {
                    if (MainHelper.isEqualIds(model.getId(), this._related[name][i].getId())) {
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
        let nulls = {};
        for (let key in columns) {
            nulls[key] = null;
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
        let asBackRef= relation._asBackRef;
        if (asBackRef === undefined ? (this.isPk(b) || !this.STORED_ATTRS.includes(b)) : asBackRef) {
            if (model.get(a) instanceof Array) {
                let index = this.getDb().indexOfId(this.get(b), model.get(a));
                if (index > -1) {
                    model.get(a).splice(index, 1);
                }
            } else {
                model.set(a, null);
            }
            remove ? model.remove(cb) : model.forceSave(cb);
        } else {
            if (this.get(b) instanceof Array) {
                let index = this.getDb().indexOfId(model.get(a), this.get(b));
                if (index > -1) {
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
        let condition = {[viaRelation._link[0]]: this.get(viaRelation._link[1])};
        let nulls = {[viaRelation._link[0]]: null};                
        if (viaRelation._where) {
            condition = ['AND', condition, viaRelation._where];
        }
        if (relation._via instanceof Array) {
            if (remove) {
                viaModel.constructor.find(condition).all((err, models)=> {
                    err ? cb(err) : async.eachSeries(models, (model, cb)=> {
                        model.remove(cb);
                    }, cb);
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
        if (!remove && this.get(b) instanceof Array) {
            // relation via array valued attr
            this.set(b, []);
            this.forceSave(cb);
        } else {
            let nulls = {[a]: null}; 
            let condition = {[a]: this.get(b)};
            if (relation._where) {
                condition = ['AND', condition, relation._where];
            }
            if (remove) {
                //model.constructor.removeAll(condition, cb);
                relation.all((err, models)=> {
                   err ? cb(err) : async.eachSeries(models, (model, cb)=> model.remove(cb), cb);
                });
            } else if (relation._viaArray) {
                model.getDb().updateAllPull(model.TABLE, {}, condition, cb);
            } else {
                model.constructor.updateAll(nulls, condition, cb);
            }
        }
    }

    bindModels (link, foreignModel, primaryModel, cb, relation) {
        let fk = link[0];
        let pk = link[1];
        let value = primaryModel.get(pk);
        if (!value) {
            cb(`${this.constructor.name}: bindModels: PK is null`);
        } else if (relation._viaArray) {
            if (!(foreignModel.get(fk) instanceof Array)) {
                foreignModel.set(fk, []);
            }
            if (this.getDb().indexOfId(value, foreignModel.get(fk)) < 0) {
                foreignModel.get(fk).push(value);
                foreignModel.forceSave(cb);
            } else {
                cb(); // value is exists already
            }
        } else {
            foreignModel.set(fk, value);
            foreignModel.forceSave(cb);
        }
    }

    // HANDLER

    getHandler (name) {
        if (typeof name === 'string') {
            name = `handler${name.toUpperCaseFirstLetter()}`;
            if (typeof this[name] === 'function') {
                return this[name];
            }
        }
        return null;
    }
};
module.exports.init();