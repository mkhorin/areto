'use strict';

const Base = require('./SessionStore');

module.exports = class DbSessionStore extends Base {

    constructor (config) {
        super(Object.assign({
            db: config.session.module.getDb(),
            table: 'session'
        }, config));
    }

    get (sid, callback) {
        this.findBySid(sid).one().then(result => {
            callback(null, result ? result.data : null);
        }, callback);
    }

    set (sid, session, callback) {
        PromiseHelper.callback(this.findBySid(sid).upsert({
            'data': session,
            'userId': session[this.userIdParam],
            'updatedAt': new Date
        }), callback);
    }

    touch (sid, session, callback) {
        PromiseHelper.callback(this.findBySid(sid).update({
            updatedAt: new Date
        }), callback);
    }

    destroy (sid, callback) {
        PromiseHelper.callback(this.findBySid(sid).remove(), callback);
    }

    clear (callback) {
        PromiseHelper.callback(this.find().remove(), callback);
    }

    removeExpired (callback) {
        if (!this.session.lifetime) {
            return callback();
        }
        let expired = new Date(Date.now() - this.session.lifetime);
        PromiseHelper.callback(this.find(['<', 'updatedAt', expired]).remove(), callback);
    }

    removeByUserId (userId, callback) {
        PromiseHelper.callback(this.find(['ID', 'userId', userId]).remove(), callback);
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