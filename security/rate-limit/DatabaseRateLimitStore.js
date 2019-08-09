/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RateLimitStore');

module.exports = class DatabaseRateLimitStore extends Base {

    constructor (config) {
        super({
            db: config.rateLimit.module.getDb(),
            table: 'rate_limit',
            ...config
        });
    }
    
    async find (type, user) {
        const model = this.createModel({type, user});
        model.setData(await this.getQueryBy(type, user).one());
        return model;
    }

    save (model) {
        return this.getQueryBy(model.type, model.user).upsert(model.getData());
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