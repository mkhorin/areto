'use strict';

const Base = require('../base/Base');

module.exports = class Query extends Base {


    constructor (config) {
        super(config);
        this._index = null;
        this._limit = null;
        this._offset = null;
        this._order = null;
        this._where = null;
    }

    getDb () {
        return this._db;
    }

    db (db) {
        this._db = db;
        return this;
    }

    from (table) {
        this._from = table;
        return this;
    }

    index (column) {
        this._index = column;
        return this;
    }

    asRaw () {
        return this;
    }
    
    // SELECT

    select (attrs) {
        this._select = attrs; // { attr1: 1, attr2: 0, ... }
        return this;
    }

    addSelect (attrs) {
        this._select
            ? Object.assign(this._select, attrs)
            : this.select(attrs);
        return this;
    }

    // WHERE

    where (condition) {
        this._where = condition ? condition : null;
        return this;
    }

    and (condition) {
        if (condition) {
            this._where = this._where
                ? ['AND', this._where, condition]
                : condition;
        }
        return this;
    }

    or (condition) {
        if (condition) {
            this._where = this._where
                ? ['OR', this._where, condition]
                : condition;
        }
        return this;
    }

    filter (condition) {
        return this.where(this.filterCondition(condition));
    }

    andFilter (condition) {
        return this.and(this.filterCondition(condition));
    }

    orFilter (condition) {
        return this.or(this.filterCondition(condition));
    }

    andNotIn (key, value) {
        return this.and(['NOT IN', key, value]);
    }

    andJoinByOr (conditions) {
        if (conditions.length === 1) {
            return this.and(conditions[0]);
        }
        if (conditions.length > 1) {
            return this.and(['OR'].concat(conditions));
        }
        return this;
    }

    // ORDER
    /**
     * @param columns - { attr1: 1, attr2: -1 }
     */
    order (columns) {
        this._order = columns;
        return this;
    }

    addOrder (columns) {
        this._order = Object.assign(this._order || {}, columns);
        return this;
    }

    orderByIn (state) {
        this._orderByIn = state;
        return this;
    }

    // OFFSET

    limit (limit) {
        this._limit = limit === null ? null : parseInt(limit);
        return this;
    }

    offset (offset) {
        this._offset = offset === null ? null : parseInt(offset);
        return this;
    }

    // COMMAND

    all () {
        return this._db.queryAll(this);
    }

    one () {
        return this._db.queryOne(this);
    }

    column (key) {
        return this._db.queryColumn(this, key);
    }

    distinct (key) {
        return this._db.queryDistinct(this, key);
    }

    scalar (key) {
        return this._db.queryScalar(this, key);
    }

    insert (data) {
        return this._db.queryInsert(this, data);
    }

    update (data) {
        return this._db.queryUpdate(this, data);
    }

    updateAll (data) {
        return this._db.queryUpdateAll(this, data);
    }

    upsert (data) {
        return this._db.queryUpsert(this, data);
    }

    remove () {
        return this._db.queryRemove(this);
    }

    count () {
        return this._db.queryCount(this);
    }

    max (key) {
        this._order = {[key]: -1};
        this._limit = 1;
        return this.scalar(key);
    }

    min (key) {
        this._order = {[key]: 1};
        this._limit = 1;
        return this.scalar(key);
    }

    //

    isEmptyValue (value) {
        return value === undefined || value === null || value === ''
            || (typeof value === 'string' && value.trim() === '')
            || (typeof value === 'object' && !Object.values(value).length);
    }
    
    prepare () {
        return Promise.resolve();
    }

    afterBuild () {
        // restore _where after filter by via relation models
        if (this._whereBeforeFilter !== undefined) {
            this._where = this._whereBeforeFilter;
            delete this._whereBeforeFilter;
        }
    }

    populate (docs) {
        if (this._index) {
            docs = QueryHelper.indexObjects(docs, this._index);
        }
        return Promise.resolve(docs);
    }

    filterCondition (data) {
        return data instanceof Array
            ? this.filterOperatorCondition(data)
            : data ? this.filterHashCondition(data)
                   : null;
    }

    // operator format: [operator, operand 1, operand 2, ...]
    filterOperatorCondition (data) {
        switch (data[0]) {
            case 'NOT':
            case 'AND':
            case 'OR':
                return this.filterSerialCondition();
            case 'BETWEEN':
            case 'NOT BETWEEN':
                return !this.isEmptyValue(data[1]) && !this.isEmptyValue(data[2])
                    ? data : null;
        }
        return this.isEmptyValue(data[1]) ? null : data;
    }

    filterSerialCondition (data) { // OR AND NOT
        for (let i = data.length - 1; i > 0; --i) {
            let item = this.filterCondition(data[i]);
            if (this.isEmptyValue(item)) {
                data.splice(i, 1);
            } else {
                data[i] = item;
            }
        }
        return data.length > 1 ? data : null;
    }

    // hash format: { column1: value1, column2: value2, ... }
    filterHashCondition (data) {
        let result = {};
        for (let key of Object.keys(data)) {
            if (!this.isEmptyValue(data[key])) {
                result[key] = data[key];
            }
        }
        return Object.values(result).length ? result : null;
    }

    // по массиву ключей упорядочить массив объектов с ключевым атрибутом (подмножество массива ключей)
    sortOrderByIn (docs) {
        let keys = this._orderByIn;
        if (!(keys instanceof Array) || keys.length < 2) {
            return docs;
        }
        // docs can be with equals key
        let map = ArrayHelper.indexObjects(docs, this.refKey);
        let result = [];
        for (let key of keys) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                result = result.concat(map[key]);
                delete map[key];
            }
        }
        return result;
    }

    clone () {        
        let target = Object.assign(new this.constructor, this);
        for (let key of Object.keys(target)) {
            let prop = target[key];
            if (prop && typeof prop === 'object') {
                if (prop instanceof Query) {
                    target[key] = prop.clone();
                } else if (prop instanceof Array) {
                    target[key] = prop.slice();
                } else if (!(prop instanceof Base)) {
                    target[key] = Object.assign({}, prop);
                }
            }
        }
        return target;
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const QueryHelper = require('../helper/QueryHelper');