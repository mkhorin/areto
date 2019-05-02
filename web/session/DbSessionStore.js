/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SessionStore');

module.exports = class DbSessionStore extends Base {

    constructor (config) {
        super({
            // 'connection': 'connection',
            'table': 'session',
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
            'data': data,
            'userId': data[this.userIdParam],
            'updatedAt': new Date
        }), callback);
    }

    touch (sid, data, callback) {
        PromiseHelper.callback(this.findBySid(sid).update({'updatedAt': new Date}), callback);
    }

    destroy (sid, callback) {
        PromiseHelper.callback(this.findBySid(sid).remove(), callback);
    }

    clear (callback) {
        PromiseHelper.callback(this.find().remove(), callback) ;
    }

    removeExpired (callback) {
        if (this.session.lifetime) {
            let expired = new Date(Date.now() - this.session.lifetime);
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
        return this.session.module.getDb(this.connection);
    }
};

const PromiseHelper = require('../../helper/PromiseHelper');
const Query = require('../../db/Query');