/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RateLimitStore');

module.exports = class DatabaseRateLimitStore extends Base {

    constructor (config) {
        super({
            table: 'rate_limit',
            ...config
        });
        this.db = this.module.getDb(this.db);
    }

    async find (type, user) {
        const model = this.createModel({type, user});
        const query = this.getQueryBy(type, user);
        const data = await query.one();
        model.setData(data);
        return model;
    }

    save (model) {
        const data = model.getData();
        const query = this.getQueryBy(model.type, model.user);
        return query.upsert(data);
    }

    getQueryBy (type, user) {
        const data = {type};
        if (user.isGuest()) {
            data.userId = null;
            data.ip = user.getIp();
        } else {
            data.userId = user.getId();
        }
        return this.getQuery().and(data);
    }

    getQuery () {
        return (new Query).db(this.db).from(this.table);
    }
};

const Query = require('../../db/Query');