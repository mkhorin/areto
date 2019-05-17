/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Query');

module.exports = class ActiveQuery extends Base {

    _asRaw = null;
    _with = {};
    _db = this.model && this.model.getDb();
    _from = this.model && this.model.TABLE;

    asRaw (value = true) {
        this._asRaw = value;
        return this;
    }

    exceptModel (model) {
        if (model instanceof this.model.constructor) {
            return model.getId()
                ? this.and(['!=', model.PK, model.getId()])
                : this;
        }
        this.model.log('error', this.wrapClassMessage(`exceptModel: Invalid model`));
        return this;
    }

    // PREPARE

    // add condition after relation criteria creating
    addAfterPrepare (handler) {
        ObjectHelper.push(handler, '_afterPrepareHandlers', this);
        return this;
    }

    prepare () {
        if (!this.primaryModel) {
            return this.afterPrepare();
        }
        if (this._viaArray) { // lazy loading of a relation
            return this.prepareViaArray();
        }
        if (this._viaTable) {
            return this.prepareViaTable(); // via junction table
        }
        if (this._viaRelation) {
            return this._viaRelation._multiple
                ? this.prepareViaMultipleRelation()
                : this.prepareViaRelation();
        }
        this.prepareFilter([this.primaryModel]);
        return this.afterPrepare();
    }

    prepareViaArray () {
        let val = this.primaryModel.get(this.linkKey);
        this._whereBeforeFilter = this._where;
        if (val === undefined || val === null || Array.isArray(val)) {
            if (this._orderByIn) {
                this._orderByIn = val;
            }
            this.and(['IN', this.refKey, val]);
        } else { // back ref to array
            this.and({[this.refKey]: val});
        }
        return this.afterPrepare();
    }

    async prepareViaTable () {
        let viaModels = await this._viaTable.findJunctionRows([this.primaryModel]);
        this.prepareFilter(viaModels);
        await this.afterPrepare();
    }

    async prepareViaMultipleRelation () {
        let models = await this._viaRelation.all();
        this.primaryModel.populateRelation(this._viaRelationName, models);
        this.prepareFilter(models);
        await this.afterPrepare();
    }

    async prepareViaRelation () {
        let model = await this._viaRelation.one();
        this.primaryModel.populateRelation(this._viaRelationName, model);
        this.prepareFilter(model ? [model] : []);
        await this.afterPrepare();
    }

    prepareFilter (models) {
        this._whereBeforeFilter = this._where;
        this.filterByModels(models);
    }

    async afterPrepare () {
        if (Array.isArray(this._afterPrepareHandlers)) {
            for (let handler of this._afterPrepareHandlers) {
                await handler(this);
            }
        }
    }

    // RELATIONS

    isMultiple () {
        return this._multiple;
    }

    isBackRef () {
        return this._asBackRef === undefined
            ? (this.primaryModel.PK === this.linkKey || !this.primaryModel.ATTRS.includes(this.linkKey))
            : this._asBackRef;
    }

    isInnerArray () {
        return this._viaArray && !this.isBackRef();
    }

    hasOne (primaryModel, refKey, linkKey) {
        this.primaryModel = primaryModel;
        this.refKey = refKey;
        this.linkKey = linkKey;
        this._multiple = false;
        return this;
    }

    hasMany (primaryModel, refKey, linkKey) {
        this.primaryModel = primaryModel;
        this.refKey = refKey;
        this.linkKey = linkKey;
        this._multiple = true;
        return this;
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
        for (let data of args) {
            if (!data) {
            } else if (typeof data === 'string') {
                this._with[data] = true;
            } else if (Array.isArray(data)) {
                this.with(...data);
            } else if (data instanceof this.constructor) {
                Object.assign(this._with, data._with);
            } else {
                Object.assign(this._with, data);
            }
        }
        return this;
    }

    withOnly (...args) {
        this._with = {};
        return this.with(...args);
    }

    via (name, filter) {
        this._viaRelation = this.primaryModel.getRelation(name);
        if (!this._viaRelation) {
            this.primaryModel.log('error', this.wrapClassMessage(`via: Relation not found: ${name}`));
            return this;
        }
        this._viaRelationName = name;
        if (typeof filter === 'function') {
            filter(this._viaRelation);
        } else if (filter) { // as condition
            this._viaRelation.and(filter);
        }
        return this;
    }

    viaTable (tableName, refKey, linkKey, filter) {
        this._viaTable = new ActiveQuery({
            model: this.primaryModel,
            refKey,
            linkKey
        });
        this._viaTable._from = tableName;
        this._viaTable._multiple = true;
        this._viaTable._asRaw = true;
        if (typeof filter === 'function') {
            filter(this._viaTable);
        } else if (filter) { // as condition
            this._viaTable.and(filter);
        }
        return this;
    }

    viaArray () {        
        this._viaArray = true;
        if (this._orderByIn === undefined) {
            this._orderByIn = true;
        }
        return this;
    }

    inverseOf (relationName) {
        this._inverseOf = relationName;
        return this;
    }

    async findWith (relations, models) {
        let primaryModel = this.model.spawn();
        relations = QueryHelper.normalizeRelations(primaryModel, relations);
        for (let name of Object.keys(relations)) {
            let relation = relations[name];
            if (relation._asRaw === null) { // relation is ActiveQuery
                relation._asRaw = this._asRaw; // inherit from primary query
            }
            await relation.populateRelation(name, models);
        }
        return models;
    }

    findFor () {
        return this._multiple ? this.all() : this.one();
    }

    // POPULATE

    async populate (docs) {
        if (this._asRaw) {
            return super.populate(docs);
        }
        let models = [];
        for (let doc of docs) {
            let model = this.model.spawn();
            model.populateRecord(doc);
            models.push(model);
            await model.afterFind();
        }
        return this.populateWith(models);
    }

    async populateWith (models) {
        if (models.length && Object.values(this._with).length) {
            await this.findWith(this._with, models);
        }
        return this._index
            ? QueryHelper.indexModels(models, this._index)
            : models;
    }

    async populateRelation (name, primaryModels) {
        let [viaModels, viaQuery] = await this.populateViaRelation(primaryModels);
        if (!this._multiple && primaryModels.length === 1) {
            let model = await this.one();
            if (!model) {
                return [];
            }
            this.populateOneRelation(name, model, primaryModels);
            return [model];
        }
        let index = this._index;
        this._index = null;
        let models = await this.all();
        let buckets = this.getRelationBuckets(models, viaModels, viaQuery);
        this._index = index;
        let key = viaQuery ? viaQuery.linkKey : this.linkKey;
        this.populateMultipleRelation(name, primaryModels, buckets, key);
        return models;
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

    populateMultipleRelation (name, primaryModels, buckets, linkKey) {
        for (let pm of primaryModels) {
            let key = QueryHelper.getAttr(pm, linkKey);
            let value = this._multiple ? [] : null;
            if (Array.isArray(key)) {
                for (let k of key) {
                    if (Object.prototype.hasOwnProperty.call(buckets, k)) {
                        value = value.concat(buckets[k]);
                    }
                }
            } else if (Object.prototype.hasOwnProperty.call(buckets, key)) {
                value = buckets[key];
            }
            if (this._index && Array.isArray(value)) {
                value = this._asRaw
                    ? QueryHelper.indexObjects(value, this._index)
                    : QueryHelper.indexModels(value, this._index);
            }
            if (pm instanceof ActiveRecord) {
                pm.populateRelation(name, value);
            } else {
                pm[name] = value;
            }
        }
    }

    async populateViaRelation (viaModels) {
        let viaQuery;
        if (this._viaTable) {
            viaQuery = this._viaTable;
            viaModels = await viaQuery.findJunctionRows(viaModels);
        }
        if (this._viaRelation) {
            if (this._viaRelation._asRaw === null) {
                this._viaRelation._asRaw = this._asRaw; // inherit from primary query
            }
            this._viaRelation.primaryModel = null;
            viaQuery = this._viaRelation;
            viaModels = await viaQuery.populateRelation(this._viaRelationName, viaModels);
        }
        this.prepareFilter(viaModels);
        return [viaModels, viaQuery];
    }

    // BUCKETS

    getRelationBuckets (models, viaModels, viaQuery) {
        let buckets = (viaModels && viaQuery)
            ? this.buildViaBuckets(models, viaModels, viaQuery.refKey)
            : this.buildBuckets(models, this.refKey);
        if (!this._multiple) {
            for (let name of Object.keys(buckets)) {
                buckets[name] = buckets[name][0];
            }
        }
        return buckets;
    }

    buildViaBuckets (models, viaModels, viaRefKey) {
        let buckets = {}, map = {};
        for (let vm of viaModels) {
            let ref = QueryHelper.getAttr(vm, viaRefKey);
            let link = QueryHelper.getAttr(vm, this.linkKey);
            if (!Object.prototype.hasOwnProperty.call(map, link)) {
                map[link] = {};
            }
            map[link][ref] = true;
        }
        for (let model of models) {
            let ref = QueryHelper.getAttr(model, this.refKey);
            if (map[ref]) {
                for (let k of Object.keys(map[ref])) {
                    if (Array.isArray(buckets[k])) {
                        buckets[k].push(model);
                    } else {
                        buckets[k] = [model];
                    }
                }
            }
        }
        return buckets;
    }

    buildBuckets (models) {
        let buckets = {};
        for (let model of models) {
            let key = QueryHelper.getAttr(model, this.refKey);
            if (Array.isArray(buckets[key])) {
                buckets[key].push(model);
            } else {
                buckets[key] = [model];
            }
        }
        return buckets;
    }

    //

    filterByModels (models) {
        if (!Array.isArray(models)) {
            return;
        }    
        let attr = this.linkKey, values = [], value;
        let isActiveRecord = models[0] instanceof ActiveRecord;
        for (let model of models) {
            value = isActiveRecord ? model.get(attr) : model[attr];
            if (Array.isArray(value)) {
                values = values.concat(value);
            } else if (value !== undefined && value !== null && value !== '') {
                values.push(value);
            }
        }
        if (this._orderByIn) {
            this._orderByIn = values;
        }
        this.and(['IN', this.refKey, values]);
    }

    findJunctionRows (primaryModels) {
        if (!primaryModels.length) {
            return [];
        }
        this.filterByModels(primaryModels);
        return this.asRaw().all();
    }
};

const ObjectHelper = require('../helper/ObjectHelper');
const QueryHelper = require('../helper/QueryHelper');
const ActiveRecord = require('./ActiveRecord');