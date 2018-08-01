'use strict';

const Base = require('./SessionStore');

module.exports = class DbSessionStore extends Base {

    constructor (config) {
        super(Object.assign({
            db: config.session.module.getDb(),
            table: 'session'
        }, config));
    }

    get (sid, cb) {
        this.findBySid(sid).one((err, result)=> {
            cb(err, result ? result.data : null);
        });
    }

    set (sid, session, cb) {
        this.findBySid(sid).upsert({
            'data': session,
            'userId': session[this.userIdParam],
            'updatedAt': new Date
        }, cb);
    }

    touch (sid, session, cb) {
        this.findBySid(sid).update({
            updatedAt: new Date
        }, cb);
    }

    destroy (sid, cb) {
        this.findBySid(sid).remove(cb);
    }

    clear (cb) {
        this.find().remove(cb);
    }

    removeExpired (cb) {
        if (!this.session.lifetime) {
            return cb();
        }
        let expired = new Date(Date.now() - this.session.lifetime);
        this.find(['<', 'updatedAt', expired]).remove(cb);
    }

    removeByUserId (userId, cb) {
        this.find(['ID', 'userId', userId]).remove(cb);
    }

    findBySid (sid) {
        return this.find({sid});
    }

    find (condition) {
        return (new Query).db(this.db).from(this.table).where(condition);
    }
};

const Query = require('../../db/Query');