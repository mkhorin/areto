'use strict';

const Base = require('../base/Base');

module.exports = class Query extends Base {

    init () {
        this._indexBy = null;
        this._limit = null;
        this._offset = null;
        this._orderBy = null;
        this._where = null;
    }

    db (db) {
        this._db = db;
        return this;
    }

    from (table) {
        this._from = table;
        return this;
    }

    indexBy (column) {
        this._indexBy = column;
        return this;
    }
    
    // SELECT

    select (attrs) {
        this._select = attrs; // { attr1: 1, attr2: 0, ... }
        return this;
    }

    addSelect (attrs) {
        this._select ? Object.assign(this._select, attrs) : this.select(attrs);
        return this;
    }

    // WHERE

    where (condition) {
        this._where = condition ? condition : null;
        return this;
    }

    andWhere (condition) {
        if (condition) {
            this._where = this._where ? ['AND', this._where, condition] : condition;
        }
        return this;
    }

    orWhere (condition) {
        if (condition) {
            this._where = this._where ? ['OR', this._where, condition] : condition;
        }
        return this;
    }

    filterWhere (condition) {
        condition = this.filterCondition(condition);
        condition.length && this.where(condition);
        return this;
    }

    andFilterWhere (condition) {
        condition = this.filterCondition(condition);
        condition.length && this.andWhere(condition);
        return this;
    }

    orFilterWhere (condition) {
        condition = this.filterCondition(condition);
        condition.length && this.orWhere(condition);
        return this;
    }

    // ORDER BY
    /**
     * @param columns - { attr1: 1, attr2: -1 }
     */
    orderBy (columns) {
        this._orderBy = columns;
        return this;
    }

    addOrderBy (columns) {
        this._orderBy = Object.assign(this._orderBy || {}, columns);
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

    all (cb) {
        this._db.queryAll(this, cb);
    }

    one (cb) {
        this._db.queryOne(this, cb);
    }

    column (key, cb) {
        this._db.queryColumn(this, key, cb);
    }

    scalar (key, cb) {
        this._db.queryScalar(this, key, cb);
    }

    insert (doc, cb) {
        this._db.queryInsert(this, doc, cb);
    }

    update (doc, cb) {
        this._db.queryUpdate(this, doc, cb);
    }

    upsert (doc, cb) {
        this._db.queryUpsert(this, doc, cb);
    }

    remove (cb) {
        this._db.queryRemove(this, cb);
    }

    count (cb) {
        this._db.queryCount(this, cb);
    }

    //

    isEmpty (value) {
        return value === undefined || value === null || value === ''
            || (typeof value === 'string' && value.trim() === '')
            || (typeof value === 'object' && Object.keys(value).length === 0);
    }
    
    prepare (cb) {
        cb();
    }

    afterBuild () {
        // restore _where after filter by via relation models
        if (this._whereBeforeFilter !== undefined) {
            this._where = this._whereBeforeFilter;
            delete this._whereBeforeFilter;
        }
    }

    populate (rows, cb) {
        if (this._indexBy) {
            let result = {};
            let indexBy = this._indexBy;
            for (let row of rows) {
                let key = typeof indexBy === 'function' ? indexBy(row) : row[indexBy];
                result[key] = row;
            }
            cb(null, result);
        } else {
            cb(null, rows);
        }
    }

    filterCondition (condition) {
        // operator format: operator, operand 1, operand 2, ...
        if (condition instanceof Array) {
            let operator = condition[0];
            switch (operator.toLowerCase()) {
                case 'NOT':
                case 'AND':
                case 'OR':
                    for (let i = condition.length - 1; i > 0; --i) {
                        let sub = this.filterCondition(condition[i]);
                        if (this.isEmpty(sub)) {
                            condition.splice(i, 1);
                        } else {
                            condition[i] = sub;
                        }
                    }
                    if (!condition.length) {
                        return [];
                    }
                    break;

                case 'BETWEEN':
                case 'NOT BETWEEN':
                    if (condition.length === 3 && (this.isEmpty(condition[1]) || this.isEmpty(condition[2]))) {
                        return [];
                    }
                    break;

                default:
                    if (condition.length > 1 && this.isEmpty(condition[1])) {
                        return [];
                    }
            }
        } else {
            // hash format: { 'column1': 'value1', 'column2': 'value2', ... }
            for (let name in condition) {
                if (this.isEmpty(condition[name])) {
                    delete condition[name];
                }
            }
        }
        return condition;
    }

    // по массиву ключей упорядочить массив объектов с ключевым атрибутом (подмножество массива ключей)
    sortOrderByIn (docs) {
        let keys = this._orderByIn;
        if (!(keys instanceof Array) || keys.length < 2) {
            return docs;
        }
        // docs can be with equals key
        let map = ArrayHelper.indexObjects(docs, this._link[0]);
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

const ArrayHelper = require('../helpers/ArrayHelper');

/*
sum (q) {
    return this.queryScalar('SUM('+ q +')');
};

min (q) {
    return this.queryScalar('MIN('+ q +')');
};

max (q) {
    return this.queryScalar('MAX('+ q +')');
};*/