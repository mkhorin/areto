'use strict';

const Base = require('./Cache');

module.exports = class DbCache extends Base {

    constructor (config) {
        super(Object.assign({
            table: 'cache'
        }, config));
    }

    init () {
        super.init();
        this._cache = {};
    }

    getValue (key, cb) {        
        this.getQuery().where({key}).one((err, doc)=> {
            if (err || !doc) {
                cb(err);
            } else if (!doc.expiredAt || doc.expiredAt > parseInt((new Date).getTime() / 1000)) {
                cb(null, doc.value);
            } else {
                cb();
            }
        });
    }

    setValue (key, value, duration, cb) {
        let expiredAt = duration ? (parseInt((new Date).getTime() / 1000) + duration) : 0;
        let query = this.getQuery().where({key});        
        query.one((err, stored)=> {
            err ? cb(err) : query.upsert({key, value, expiredAt}, cb);
        });
    }

    removeValue (key, cb) {
        this.getQuery().where({key}).remove(cb);
    }

    flushValues (cb) {
        this.db.truncate(this.table, cb);
    }

    getQuery () {
        return (new Query).db(this.module.getDb()).from(this.table);
    }
};

const Query = require('../db/Query');