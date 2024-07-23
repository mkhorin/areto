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

    get (id, callback) {
        this.findById(id).one().then(result => {
            callback(null, result ? result.data : undefined);
        }, callback);
    }

    set (id, data, callback) {
        PromiseHelper.callback(this.findById(id).upsert({
            sid: id,
            uid: data[this.userIdParam],
            updatedAt: new Date,
            data
        }), callback);
    }

    touch (id, data, callback) {
        PromiseHelper.callback(this.findById(id).update({
            updatedAt: new Date
        }), callback);
    }

    destroy (id, callback) {
        PromiseHelper.callback(this.deleteById(id), callback);
    }

    clear (callback) {
        PromiseHelper.callback(this.find().delete(), callback);
    }

    getById (id) {
        return this.findById(id).one();
    }

    count (search) {
        return this.findBySearch(search).count();
    }

    list (start, length, search) {
        return this.findBySearch(search).offset(start).limit(length).all();
    }

    deleteExpired () {
        if (this.session.lifetime) {
            const time = Date.now() - this.session.lifetime;
            const date = new Date(time);
            return this.find(['<', 'updatedAt', date]).delete();
        }
    }

    deleteById (id) {
        return this.findById(id).delete();
    }

    deleteByUserId (id) {
        return this.find(this.getUserIdCondition(id)).delete();
    }

    findBySearch (sid) {
        return sid
            ? this.find(['or', {sid}, this.getUserIdCondition(sid)])
            : this.find();
    }

    findById (sid) {
        return this.find({sid});
    }

    find (condition) {
        return (new Query).db(this.db).from(this.table).where(condition);
    }

    getUserIdCondition (id) {
        return ['id', 'uid', id];
    }
};

const PromiseHelper = require('../../helper/PromiseHelper');
const Query = require('../../db/Query');