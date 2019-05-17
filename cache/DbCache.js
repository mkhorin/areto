/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Cache');

module.exports = class DbCache extends Base {

    _cache = {};

    constructor (config) {
        super({
            table: 'cache',
            ...config
        });
    }

    async getValue (key) {
        let doc = await this.getQuery().and({key}).one();
        if (doc && (!doc.expiredAt || doc.expiredAt > Date.now() / 1000)) {
            return doc.value;
        }
    }

    setValue (key, value, duration) {
        let expiredAt = duration
            ? Math.trunc(Date.now() / 1000 + duration)
            : 0;
        return this.getQuery().and({key}).upsert({key, value, expiredAt});
    }

    removeValue (key) {
        return this.getQuery().and({key}).remove();
    }

    flushValues () {
        return this.db.truncate(this.table);
    }

    getQuery () {
        return (new Query).db(this.module.getDb()).from(this.table);
    }
};

const Query = require('../db/Query');