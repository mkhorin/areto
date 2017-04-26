'use strict';

const Base = require('./Query');
const async = require('async');

module.exports = class ActiveQuery extends Base {

    constructor (model) {
        super({model});
    }

    init () {
        super.init();
        this._asArray = null;
        this._with = {};
        if (this.model) { // for clone
            this._db = this.model.getDb();
            this._from = this.model.TABLE;
        }
    }

    asArray (value = true) {
        this._asArray = value;
        return this;
    }

    exceptModel (model) {
        if (model instanceof this.model.constructor) {
            return model.getId() ? this.andWhere(['!=', model.PK, model.getId()]) : this;
        } else {
            this.model.module.log('error', `ActiveQuery: exceptModel: ${this.model.constructor.name}: Invalid target model`);
            return this;
        }
    }

    // PREPARE

    // add condition after creating relation conditions
    addAfterPrepare (handler) {
        if (!this._afterPrepareHandlers) {
            this._afterPrepareHandlers = [];
        }
        this._afterPrepareHandlers.push(handler);
        return this;
    }

    execAfterPrepare (cb) {        
        this._afterPrepareHandlers instanceof Array
            ? async.eachSeries(this._afterPrepareHandlers, (handler, cb)=> handler(cb, this), cb)
            : cb();
    }

    prepare (cb) {
        if (this._primaryModel) {
            // lazy loading of a relation
            if (this._viaArray) {
                this.prepareViaArray(cb);
            } else if (this._via instanceof ActiveQuery) {
                this.prepareViaTable(cb); // via junction table
            } else if (this._via instanceof Array) {
                this.prepareViaRelation(cb);
            } else {
                this.prepareFilter([this._primaryModel]);
                this.execAfterPrepare(cb);
            }
        } else {
            this.execAfterPrepare(cb);
        }
    }

    prepareViaArray (cb) {
        let val = this._primaryModel.get(this._link[1]);
        this._whereBeforeFilter = this._where;
        if (val === undefined || val === null || val instanceof Array) {
            if (this._orderByIn) {
                this._orderByIn = val;
            }
            this.andWhere(['IN', this._link[0], val]);
        } else { // back ref to array
            this.andWhere(['=', this._link[0], val]);
        }
        this.execAfterPrepare(cb);
    }

    prepareViaTable (cb) {
        this._via.findJunctionRows([this._primaryModel], (err, viaModels)=> {
            if (err) {
                return cb(err);
            }
            this.prepareFilter(viaModels);
            this.execAfterPrepare(cb);
        });
    }

    prepareViaRelation (cb) {
        let viaName = this._via[0];
        let viaQuery = this._via[1];
        if (viaQuery._multiple) {
            viaQuery.all((err, viaModels)=> {
                if (err) {
                    return cb(err);
                }
                this._primaryModel.populateRelation(viaName, viaModels);
                this.prepareFilter(viaModels);
                this.execAfterPrepare(cb);
            });
        } else {
            viaQuery.one((err, model)=> {
                if (err) {
                    return cb(err);
                }
                this._primaryModel.populateRelation(viaName, model);
                this.prepareFilter(model ? [model] : []);
                this.execAfterPrepare(cb);
            });
        }
    }

    prepareFilter (models) {
        this._whereBeforeFilter = this._where;
        this.filterByModels(models);
    }

    // RELATIONS

    getPrimaryModel () {
        return this._primaryModel;
    }

    isMultiple () {
        return this._multiple;
    }

    hasOne (primaryModel, link) {
        this._multiple = false;
        this._primaryModel = primaryModel;
        this._link = link;
        return this;
    }

    hasMany (primaryModel, link) {
        this._multiple = true;
        this._primaryModel = primaryModel;
        this._link = link;
        this._asBackRef = true;
        return this;
    }

    isAsBackRef () {
        return this._asBackRef;
    }

    asBackRef (value = true) {
        this._asBackRef = value;
        return this;
    }

    removeOnUnlink (value = true) {
        this._removeOnUnlink = value;
        return this;
    }

    with (...args) {
        for (let arg of args) {
            if (arg) {
                if (arg instanceof Array) {
                    this.with.apply(this, arg);
                } else if (typeof arg === 'object') {
                    Object.assign(this._with, arg);
                } else {
                    this._with[arg] = null;
                }
            }    
        }
        return this;
    }

    via (name, callable) {
        let relation = this._primaryModel.getRelation(name);
        if (relation) {
            this._via = [name, relation];
            callable && callable(relation);
        } else {
            this._primaryModel.module.log('error', `ActiveQuery: via: not found relation: ${name}`);
        }
        return this;
    }

    viaTable (tableName, link, callable) {
        let relation = new ActiveQuery(this._primaryModel);
        relation._from = tableName;
        relation._link = link;
        relation._multiple = true;
        relation._asArray = true;        
        callable && callable(relation);
        this._via = relation;
        return this;
    }

    viaArray () {        
        this._viaArray = true;
        this._asBackRef = false;
        if (this._orderByIn === undefined) {
            this._orderByIn = true;
        }
        return this;
    }

    inverseOf (relationName) {
        this._inverseOf = relationName;
        return this;
    }

    findWith (relations, models, cb) {
        let primaryModel = new this.model.constructor;
        relations = this.normalizeRelations(primaryModel, relations);
        async.forEachOf(relations, (relation, name, cb)=> {
            if (relation._asArray === null) { // relation is ActiveQuery
                relation.asArray(this._asArray); // inherit asArray from primary query
            }
            relation.populateRelation(name, models, cb);
        }, err => cb(err, models));
    }

    findFor (cb) {
        this._multiple ? this.all(cb) : this.one(cb);
    }

    normalizeRelations (model, relations) {
        let result = {}; // { relationName: new ActiveQuery, ... }
        for (let name in relations) {
            let handler = relations[name];
            let childName = null;
            let pos = name.indexOf('.');
            if (pos > 0) {
                childName = name.substring(pos + 1);
                name = name.substring(0, pos);
            }
            let relation = model.getRelation(name);
            if (relation) {
                relation._primaryModel = null;
                result[name] = relation;
                // sub-relations -> orders.customer.address...
                if (childName) {
                    relation._with[childName] = handler;
                } else if (handler) {
                    handler(relation);
                }
            }
        }
        return result;
    }
    
    // POPULATE

    populate (rows, cb) {
        if (this._asArray) {
            return super.populate(rows, cb);
        }
        let models = [];
        async.each(rows, (row, cb)=> {
            let model = new this.model.constructor;
            model.populateRecord(row);
            models.push(model);
            model.afterFind(cb);
        }, err => {
            if (err) {
                cb(err);
            } else if (models.length && Object.keys(this._with).length) {
                this.findWith(this._with, models, err => {
                    cb(err, this._indexBy ? this.indexModels(models) : models);
                });
            } else {
                cb(null, this._indexBy ? this.indexModels(models) : models);
            }
        });
    }

    populateRelation (name, primaryModels, cb) {
        this.populateViaRelation(primaryModels, (err, viaModels, viaQuery)=> {
            if (err) {
                cb(err);
            } else if (!this._multiple && primaryModels.length === 1) {
                this.one((err, model)=> {
                    if (err) {
                        cb(err);
                    } else if (model) {
                        this.populateOneRelation(name, model, primaryModels);
                        cb(null, [model]);
                    } else {
                        cb(null, []);
                    }
                });
            } else {
                let indexBy = this._indexBy;
                this._indexBy = null;
                this.all((err, models)=> {
                    if (err) {
                        return cb(err);
                    }
                    let buckets = this.getRelationBuckets(models, viaModels, viaQuery);
                    this._indexBy = indexBy;
                    if (indexBy !== null && this._multiple) {
                        buckets = this.indexBuckets(buckets, indexBy);
                    }
                    let link = viaQuery ? viaQuery._link[1] : this._link[1];
                    this.populateMultipleRelation(name, primaryModels, buckets, link);
                    cb(null, models);
                });
            }
        });
    }

    populateOneRelation (name, model, primaryModels) {
        for (let pm of primaryModels) {
            if (pm instanceof ActiveRecord) {
                pm.populateRelation(name, model);
            } else {
                pm[name] = model;
            }
        }
    }

    populateMultipleRelation (name, primaryModels, buckets, link) {
        for (let pm of primaryModels) {
            let key = this.getModelKey(pm, link);
            let value = Object.prototype.hasOwnProperty.call(buckets, key)
                ? buckets[key] : (this._multiple ? [] : null);
            if (pm instanceof ActiveRecord) {
                pm.populateRelation(name, value);
            } else {
                pm[name] = value;
            }
        }
    }

    populateViaRelation (primaryModels, cb) {
        if (this._via instanceof ActiveQuery) {
            // via junction table
            let viaQuery = this._via;
            this._via.findJunctionRows(primaryModels, (err, viaModels)=> {
                this.prepareFilter(viaModels);
                cb(err, viaModels, viaQuery);
            });
        } else if (this._via instanceof Array) {
            // via relation
            let viaName = this._via[0];
            let viaQuery = this._via[1];
            if (viaQuery._asArray === null) {
                // inherit asArray from primary query
                viaQuery.asArray(this._asArray);
            }
            viaQuery._primaryModel = null;
            viaQuery.populateRelation(viaName, primaryModels, (err, viaModels)=> {
                this.prepareFilter(viaModels);
                cb(err, viaModels, viaQuery);
            });
        } else {
            this.prepareFilter(primaryModels);
            cb();
        }
    }

    // BUCKETS

    getRelationBuckets (models, viaModels, viaQuery) {
        let buckets = (viaModels && viaQuery)
            ? this.buildViaBuckets(models, this._link, viaModels, viaQuery._link)
            : this.buildBuckets(models, this._link);
        if (!this._multiple) {
            for (let name of Object.keys(buckets)) {
                buckets[name] = buckets[name][0];
            }
        }
        return buckets;
    }

    buildViaBuckets (models, link, viaModels, viaLink) {
        let buckets = {};
        let linkKey = link[0];
        let viaLinkKey = viaLink[0];
        let linkValue = link[1];
        let map = {};
        for (let vm of viaModels) {
            let key1 = this.getModelKey(vm, viaLinkKey);
            let key2 = this.getModelKey(vm, linkValue);
            if (!Object.prototype.hasOwnProperty.call(map, key2)) {
                map[key2] = {};
            }
            map[key2][key1] = true;
        }
        for (let m of models) {
            let key = this.getModelKey(m, linkKey);
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                for (let k in map[key]) {
                    if (buckets[k] instanceof Array) {
                        buckets[k].push(m);
                    } else {
                        buckets[k] = [m];
                    }
                }
            }
        }
        return buckets;
    }

    buildBuckets (models, link) {
        let buckets = {};
        let linkKey = link[0];
        for (let m of models) {
            let key = this.getModelKey(m, linkKey);
            if (buckets[key] instanceof Array) {
                buckets[key].push(m);
            } else {
                buckets[key] = [m];
            }
        }
        return buckets;
    }

    indexBuckets (buckets, indexBy) {
        let index, result = {};
        for (let key in buckets) {
            result[key] = [];
            for (let model of buckets[key]) {
                index = typeof indexBy === 'function'
                    ? indexBy(model)
                    : (model instanceof ActiveRecord ? model.get(indexBy) : model[indexBy]);
                result[key][index] = model;
            }
        }
        return result;
    }
    
    //

    getModelKey (model, attr) {
        return model instanceof ActiveRecord ? model.get(attr) : model[attr];
    }

    filterByModels (models) {
        if (!(models instanceof Array)) {
            return;
        }    
        let attr = this._link[1];
        let isActiveRecord = models[0] instanceof ActiveRecord;
        let value, values = [];
        for (let model of models) {
            value = isActiveRecord ? model.get(attr) : model[attr];
            if (value instanceof Array) {
                values = values.concat(value);
            } else if (value !== undefined && value !== null) {
                values.push(value);
            }   
        }
        if (this._orderByIn) {
            this._orderByIn = values;
        }    
        this.andWhere(['IN', this._link[0], values]);
    }

    indexModels (models) {
        let indexBy = this._indexBy;
        let map = {};
        for (let model of models) {
            let key = typeof indexBy === 'function' ? indexBy(model) : model.get(indexBy);
            map[key] = model;
        }
        return map;
    }

    findJunctionRows (primaryModels, cb) {
        if (primaryModels.length) {
            this.filterByModels(primaryModels);
            let pm = primaryModels[0];
            if (!(pm instanceof ActiveRecord)) {
                // when primaryModels are array of arrays (asArray case)
                pm = new this.model.constructor;
            }
            this.asArray().all(cb);
        } else {
            cb(null, []);
        }
    }
};

const ActiveRecord = require('./ActiveRecord');