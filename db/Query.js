/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Query extends Base {

    _index = null;
    _limit = null;
    _offset = null;
    _order = null;
    _where = null;

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

    raw () {
        return this;
    }

    getDb () {
        return this._db;
    }

    getTable () {
        return this._from;
    }

    getIndex () {
        return this._index;
    }

    getRaw () {
        return this._raw;
    }

    // OPTIONS

    getOptions () {
        return this._options;
    }

    options (data) {
        this._options = data;
        return this;
    }

    addOptions (data) {
        this._options = this._options ? Object.assign(this._options, data) : data;
        return this;
    }

    // SELECT

    select (data) {
        if (Array.isArray(data)) {
            this.select(data[0]);
            for (let i = 1; i < data.length; ++i) {
                this.addSelect(data[i]);
            }
        } else if (typeof data === 'string') {
            this._select = {[data]: 1};
        } else {
            this._select = data;
        }
        return this;
    }

    addSelect (data) {
        if (!this._select) {
            return this.select(data);
        }
        if (Array.isArray(data)) {
            for (const item of data) {
                this.addSelect(item);
            }
        } else if (typeof data === 'string') {
            this._select[data] = 1;
        } else {
            Object.assign(this._select, data);
        }
        return this;
    }

    getSelect () {
        return this._select;
    }

    // WHERE

    where (condition) {
        this._where = condition;
        return this;
    }

    addWhere (operator, ...conditions) {
        if (!this._where) {
            this._where = conditions.length > 1 ? [operator, ...conditions] : conditions[0];
        } else if (this._where[0] === operator) {
            this._where.push(...conditions);
        } else {
            this._where = [operator, this._where, ...conditions];
        }
    }

    getWhere () {
        return this._where;
    }

    and () {
        if (arguments[0]) {
            this.addWhere('and', ...arguments);
        }
        return this;
    }

    or () {
        if (arguments[0]) {
            this.addWhere('or', ...arguments);
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
        return this.and(['notIn', key, value]);
    }

    /**
     * Set sort order
     * @param {Object} data - {attr1: 1, attr2: -1}
     */
    order (data) {
        this._order = data;
        return this;
    }

    addOrder (data) {
        this._order = this._order ? Object.assign(this._order, data) : data;
        return this;
    }

    orderByKeys (keys) {
        this._orderByKeys = keys;
        return this;
    }

    // LIMIT

    limit (limit) {
        this._limit = limit === null ? null : parseInt(limit);
        return this;
    }

    getLimit () {
        return this._limit;
    }

    // OFFSET

    offset (value) {
        this._offset = value === null ? null : parseInt(value);
        return this;
    }

    getOffset () {
        return this._offset;
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

    id () {
        return this._db.queryScalar(this, '_id');
    }

    ids () {
        return this._db.queryColumn(this, '_id');
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

    delete () {
        return this._db.queryDelete(this);
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
    }

    afterBuild () {
        // restore _where after filter by via relation models
        if (this._whereBeforeFilter !== undefined) {
            this._where = this._whereBeforeFilter;
            delete this._whereBeforeFilter;
        }
    }

    populate (docs) {
        return this._index
            ? QueryHelper.indexObjects(docs, this._index)
            : docs;
    }

    filterCondition (data) {
        return Array.isArray(data)
            ? this.filterOperatorCondition(data)
            : data ? this.filterHashCondition(data)
                   : null;
    }

    /**
     * @param {Array} data - [operator, operand 1, operand 2, ...]
     */
    filterOperatorCondition (data) {
        switch (data[0]) {
            case 'and':
            case 'or':
            case 'not': {
                return this.filterSerialCondition();
            }
            case 'between':
            case 'notBetween': {
                return !this.isEmptyValue(data[1]) && !this.isEmptyValue(data[2]) ? data : null;
            }
        }
        return this.isEmptyValue(data[1]) ? null : data;
    }

    filterSerialCondition (data) {
        for (let i = data.length - 1; i > 0; --i) {
            const item = this.filterCondition(data[i]);
            if (this.isEmptyValue(item)) {
                data.splice(i, 1);
            } else {
                data[i] = item;
            }
        }
        return data.length > 1 ? data : null;
    }

    /**
     * @param {Object} data - {column1: value1, column2: value2, ...}
     */
    filterHashCondition (data) {
        const result = {};
        for (const key of Object.keys(data)) {
            if (!this.isEmptyValue(data[key])) {
                result[key] = data[key];
            }
        }
        return Object.values(result).length ? result : null;
    }

    /**
     * Sort an array of objects with a key attribute by an array of keys
     * @param {Array} docs
     * @returns {*}
     */
    sortOrderByKeys (docs) {
        const keys = this._orderByKeys;
        if (!Array.isArray(keys) || keys.length < 2) {
            return docs;
        }
        // documents can be with equal key values
        const data = IndexHelper.indexObjectArrays(docs, this.refKey);
        const result = [];
        for (const key of keys) {
            if (Array.isArray(data[key])) {
                result.push(...data[key]);
                delete data[key]; // ignore same keys
            }
        }
        return result;
    }
};

const IndexHelper = require('../helper/IndexHelper');
const QueryHelper = require('../helper/QueryHelper');