'use strict';

const Base = require('./QueryTrait');

module.exports = class Query extends Base {

    constructor (db, config) {
        super(config);
        this._db = db;
    }

    db (db) {
        this._db = db;
        return this;
    }

    prepare (cb) {
        cb();
    }

    select (attrs) {
        this._select = attrs; // { attr1: 1, attr2: 0, ... }
        return this;
    }

    addSelect (attrs) {
        this._select ? Object.assign(this._select, attrs) : this.select(attrs);
        return this;
    }

    all (cb) {
        this._db.queryAll(this, cb);
    }

    one (cb) {
        this._db.queryOne(this, cb);
    }

    column (key, cb) {
        this._db.queryColumn(this, key, cb);
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

    // по данному массиву ключей упорядочить массив объектов с ключевым атрибутом (подмножество массива ключей)
    sortOrderByIn (docs) {
        if (!(this._orderByIn instanceof Array) || this._orderByIn.length < 2) {
            return docs;
        }
        // docs can be with equals key
        let link = this._link[0];
        let keys = this._orderByIn;
        let map = {};
        for (let doc of docs) {
            let id = doc[link];
            if (!map[id]) {
                map[id] = [];
            }
            map[id].push(doc);
        }
        let args = [];
        for (let i =  keys.length - 1; i >= 0; --i) {
            args.push(map[keys[i]]);
        }
        let values = [];
        values = values.concat.apply(values, args);
        return values.length !== docs.length ? null : values;
    }

    clone () {
        const Base = require('../base/Base');
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