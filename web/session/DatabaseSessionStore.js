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
        PromiseHelper.callback(this.findBySid(sid).remove(), callback);
    }

    clear (callback) {
        PromiseHelper.callback(this.find().remove(), callback) ;
    }

    removeExpired () {
        if (this.session.lifetime) {
            const expired = new Date(Date.now() - this.session.lifetime);
            return this.find(['<', 'updatedAt', expired]).remove();
        }
    }

    removeByUserId (userId) {
        return this.find(['ID', 'userId', userId]).remove();
    }

    findBySid (sid) {
        return this.find({sid});
    }

    find (condition) {
        return (new Query).db(this.getDb()).from(this.table).where(condition);
    }

    getDb () {
        return this.session.module.getDb(this.db);
    }
};

const PromiseHelper = require('../../helper/PromiseHelper');
const Query = require('../../db/Query');