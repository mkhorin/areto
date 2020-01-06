/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SessionStore');

module.exports = class DatabaseSessionStore extends Base {

    constructor (config) {
        super({
            table: 'session',
            ...config
        });
        this.db = this.module.getDb(this.db);
    }

    get (sid, callback) {
        this.findBySid(sid).one().then(result => {
            callback(null, result ? result.data : undefined);
        }, callback);
    }

    set (sid, data, callback) {
        PromiseHelper.callback(this.findBySid(sid).upsert({            
            userId: data[this.userIdParam],
            updatedAt: new Date,
            data
        }), callback);
    }

    touch (sid, data, callback) {
        PromiseHelper.callback(this.findBySid(sid).update({updatedAt: new Date}), callback);
    }

    destroy (sid, callback) {
        PromiseHelper.callback(this.findBySid(sid).delete(), callback);
    }

    clear (callback) {
        PromiseHelper.callback(this.find().delete(), callback);
    }

    deleteExpired () {
        if (this.session.lifetime) {
            const expired = new Date(Date.now() - this.session.lifetime);
            return this.find(['<', 'updatedAt', expired]).delete();
        }
    }

    deleteByUserId (userId) {
        return this.find(['ID', 'userId', userId]).delete();
    }

    findBySid (sid) {
        return this.find({sid});
    }

    find (condition) {
        return (new Query).db(this.db).from(this.table).where(condition);
    }
};

const PromiseHelper = require('../../helper/PromiseHelper');
const Query = require('../../db/Query');