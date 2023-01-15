/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Cache');

module.exports = class DatabaseCache extends Base {

    _cache = {};

    static getNow () {
        return Date.now() / 1000;
    }

    constructor (config) {
        super({
            table: 'cache',
            ...config
        });
        this.db = this.module.getDb(this.db);
    }

    async getValue (key) {
        const query = this.getQuery().and({key});
        const data = await query.one();
        if (data) {
            if (!data.expiredAt || data.expiredAt > this.constructor.getNow()) {
                return data.value;
            }
        }
    }

    setValue (key, value, duration) {
        const expiredAt = duration
            ? Math.trunc(this.constructor.getNow() + duration)
            : 0;
        const query = this.getQuery().and({key});
        return query.upsert({key, value, expiredAt});
    }

    removeValue (key) {
        return this.getQuery().and({key}).delete();
    }

    flushValues () {
        return this.db.truncate(this.table);
    }

    getQuery () {
        return (new Query).db(this.db).from(this.table);
    }
};

const Query = require('../db/Query');