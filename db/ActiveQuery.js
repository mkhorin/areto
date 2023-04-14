/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Query');

module.exports = class ActiveQuery extends Base {

    _db = this.model.getDb();
    _from = this.model.getTable();
    _raw = null;

    byId (id) {
        return this.and(['id', this.model.PK, id]);
    }

    id () {
        return this._db.queryScalar(this, this.model.PK);
    }

    ids () {
        return this._db.queryColumn(this, this.model.PK);
    }

    raw (value = true) {
        this._raw = value;
        return this;
    }

    excludeModel (model) {
        return model?.getId()
            ? this.and(['!=', model.PK, model.getId()])
            : this;
    }

    indexByKey () {
        return this.index(this.model.PK);
    }

    orderByKey (direction = 1) {
        return this.order({[this.model.PK]: direction});
    }

    // PREPARE

    /**
     * Add condition after relation criteria creating
     * @param handler - callback function
     */
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
            return this._viaRelation.isMultiple()
                ? this.prepareViaMultipleRelation()
                : this.prepareViaRelation();
        }
        this.prepareFilter([this.primaryModel]);
        return this.afterPrepare();
    }

    prepareViaArray () {
        this._whereBeforeFilter = this._where;
        const value = this.primaryModel.get(this.linkKey);
        if (value === undefined || value === null) {
            this.where(['false']);
        } else if (Array.isArray(value)) {
            if (this._orderByKeys) {
                this._orderByKeys = value;
            }
            this.and(['in', this.refKey, value]);
        } else { // back reference to array
            this.and({[this.refKey]: value});
        }
        return this.afterPrepare();
    }

    async prepareViaTable () {
        const viaModels = await this._viaTable.resolveJunctionRows([this.primaryModel]);
        this.prepareFilter(viaModels);
        await this.afterPrepare();
    }

    async prepareViaMultipleRelation () {
        const models = await this._viaRelation.all();
        this.primaryModel.populateRelation(this._viaRelationName, models);
        this.prepareFilter(models);
        await this.afterPrepare();
    }

    async prepareViaRelation () {
        const model = await this._viaRelation.one();
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
            for (const handler of this._afterPrepareHandlers) {
                await handler(this);
            }
        }
    }

    // RELATION

    asBackRef (value = true) {
        this._asBackRef = value;
        return this;
    }

    multiple (value = true) {
        this._multiple = value;
        return this;
    }

    isBackRef () {
        if (this._asBackRef !== undefined) {
            return this._asBackRef;
        }
        return this.primaryModel.PK === this.linkKey
            || !this.primaryModel.ATTRS.includes(this.linkKey);
    }

    isMultiple () {
        return this._multiple;
    }

    isInternalArray () {
        return this._viaArray && !this.isBackRef();
    }

    isOuterLink () {
        return this._viaRelation || this._viaTable;
    }

    getViaArray () {
        return this._viaArray;
    }

    getViaRelation () {
        return this._viaRelation;
    }

    getViaRelationName () {
        return this._viaRelationName;
    }

    getViaTable () {
        return this._viaTable;
    }

    relateOne (primaryModel, refKey, linkKey) {
        this.primaryModel = primaryModel;
        this.refKey = refKey;
        this.linkKey = linkKey;
        this._multiple = false;
        return this;
    }

    relateMany (primaryModel, refKey, linkKey) {
        this.primaryModel = primaryModel;
        this.refKey = refKey;
        this.linkKey = linkKey;
        this._multiple = true;
        return this;
    }

    with (...relations) {
        this._with = this._with || {};
        for (const data of relations) {
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

    withOnly () {
        this._with = {};
        return this.with(...arguments);
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
        this._viaTable = new this.constructor({
            model: this.primaryModel,
            refKey,
            linkKey
        });
        this._viaTable.from(tableName).multiple().raw();
        if (typeof filter === 'function') {
            filter(this._viaTable);
        } else if (filter) { // as condition
            this._viaTable.and(filter);
        }
        return this;
    }

    viaArray () {
        this._viaArray = true;
        if (this._orderByKeys === undefined) {
            this._orderByKeys = true;
        }
        return this;
    }

    inverseOf (relationName) {
        this._inverseOf = relationName;
        return this;
    }

    async resolveWith (data, models) {
        data = QueryHelper.normalizeRelations(this.model.spawnSelf(), data);
        for (const name of Object.keys(data)) {
            const relation = data[name];
            if (relation.getRaw() === null) { // relation is ActiveQuery
                relation.raw(this._raw); // inherit from primary query
            }
            await relation.populateRelation(name, models);
        }
    }

    resolve () {
        return this._multiple
            ? (this.hasLinkValue() ? this.all() : [])
            : (this.hasLinkValue() ? this.one() : null);
    }

    hasLinkValue () {
        if (this._viaRelation || this._viaTable) {
            return true;
        }
        const link = this.primaryModel.get(this.linkKey);
        if (link === null || link === undefined) {
            return false;
        }
        return !Array.isArray(link) || link.length;
    }

    // POPULATE

    populate (items) {
        if (this._raw) {
            return super.populate(items);
        }
        const models = [];
        for (const item of items) {
            const model = this.model.spawnSelf();
            model.populate(item);
            models.push(model);
        }
        return this.populateWith(models);
    }

    async populateWith (models) {
        if (this._with && models.length) {
            await this.resolveWith(this._with, models);
        }
        return this._index
            ? QueryHelper.indexModels(models, this._index)
            : models;
    }

    async populateRelation (name, primaryModels) {
        const [viaModels, viaQuery] = await this.populateViaRelation(primaryModels);
        if (!this._multiple && primaryModels.length === 1) {
            return this.populateOneRelation(name, primaryModels);
        }
        const index = this._index;
        this._index = null;
        const models = await this.all();
        const buckets = this.getRelationBuckets(models, viaModels, viaQuery);
        this._index = index;
        const key = viaQuery ? viaQuery.linkKey : this.linkKey;
        this.populateMultipleRelation(name, primaryModels, buckets, key);
        return models;
    }

    async populateOneRelation (name, primaryModels) {
        const models = await this.all();
        if (!models.length) {
            return models;
        }
        const model = models[0];
        for (const pm of primaryModels) {
            if (typeof pm.populateRelation === 'function') {
                pm.populateRelation(name, model);
            } else {
                pm[name] = model;
            }
        }
        return models.length > 1 ? models.slice(0, 1) : models;
    }

    populateMultipleRelation (name, primaryModels, buckets, linkKey) {
        for (const pm of primaryModels) {
            const key = ObjectHelper.getValueFromGetterFirst(linkKey, pm);
            let value = this._multiple ? [] : null;
            if (Array.isArray(key)) {
                for (const item of key) {
                    if (Object.hasOwn(buckets, item)) {
                        value = value.concat(buckets[item]);
                    }
                }
            } else if (Object.hasOwn(buckets, key)) {
                value = buckets[key];
            }
            if (this._index && Array.isArray(value)) {
                value = this._raw
                    ? QueryHelper.indexObjects(value, this._index)
                    : QueryHelper.indexModels(value, this._index);
            }
            if (typeof pm.populateRelation === 'function') {
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
            viaModels = await viaQuery.resolveJunctionRows(viaModels);
        }
        if (this._viaRelation) {
            if (this._viaRelation.getRaw() === null) {
                this._viaRelation.raw(this._raw); // inherit from primary query
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
        const buckets = (viaModels && viaQuery)
            ? this.buildViaBuckets(models, viaModels, viaQuery.refKey)
            : this.buildBuckets(models, this.refKey);
        if (!this._multiple) {
            for (const name of Object.keys(buckets)) {
                buckets[name] = buckets[name][0];
            }
        }
        return buckets;
    }

    buildViaBuckets (models, viaModels, viaRefKey) {
        const buckets = {}, data = {};
        for (const model of viaModels) {
            const ref = ObjectHelper.getValueFromGetterFirst(viaRefKey, model);
            const link = ObjectHelper.getValueFromGetterFirst(this.linkKey, model);
            if (!Object.hasOwn(data, link)) {
                data[link] = {};
            }
            data[link][ref] = true;
        }
        for (const model of models) {
            const ref = ObjectHelper.getValueFromGetterFirst(this.refKey, model);
            if (data[ref]) {
                for (const key of Object.keys(data[ref])) {
                    if (Array.isArray(buckets[key])) {
                        buckets[key].push(model);
                    } else {
                        buckets[key] = [model];
                    }
                }
            }
        }
        return buckets;
    }

    buildBuckets (models) {
        const buckets = {};
        for (const model of models) {
            const key = ObjectHelper.getValueFromGetterFirst(this.refKey, model);
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
            return false;
        }
        const values = [];
        const isActiveRecord = models[0] instanceof ActiveRecord;
        const attr = this.linkKey;
        for (const model of models) {
            const value = isActiveRecord ? model.get(attr) : model[attr];
            if (Array.isArray(value)) {
                values.push(...value);
            } else if (value !== undefined && value !== null && value !== '') {
                values.push(value);
            }
        }
        if (this._orderByKeys) {
            this._orderByKeys = values;
        }
        values.length
            ? this.and(['in', this.refKey, values])
            : this.where(['false']);
    }

    resolveJunctionRows (models) {
        if (!models.length) {
            return [];
        }
        this.filterByModels(models);
        return this.raw().all();
    }
};

const ObjectHelper = require('../helper/ObjectHelper');
const QueryHelper = require('../helper/QueryHelper');
const ActiveRecord = require('./ActiveRecord');