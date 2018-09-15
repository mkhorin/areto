/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RateLimitStore');

module.exports = class DbRateLimitStore extends Base {

    constructor (config) {
        super(Object.assign({
            db: config.rateLimit.module.getDb(),
            table: 'rate_limit'
        }, config));
    }
    
    async find (type, user) {
        let model = this.createModel({type, user});
        model.setData(await this.getQueryBy(type, user).one());
        return model;
    }

    save (model) {
        return this.getQueryBy(model.type, model.user).upsert(model.getData());
    }

    getQueryBy (type, user) {
        let query = this.getQuery().and({type});
        return user.isGuest()
            ? query.and({
                ip: user.getIp(),
                userId: null
            })
            : query.and({
                userId: user.getId()
            });
    }

    getQuery () {
        return (new Query).db(this.db).from(this.table);
    }
};

const Query = require('../../db/Query');