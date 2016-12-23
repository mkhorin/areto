'use strict';

const Base = require('./DbSessionStore');

module.exports = class MongoSessionStore extends Base {

    constructor (config) {
        super(Object.assign({
            userIdParam: '__id',
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
            data: session,
            userId: session[this.userIdParam],
            updatedAt: new Date
        }, cb);
    }

    touch (sid, session, cb) {
        this.findBySid(sid).update({ 
            updatedAt: new Date 
        }, cb);
    }

    removeExpired (elapsedSeconds, cb) {
        let expired = new Date;
        expired.setSeconds(expired.getSeconds() - elapsedSeconds);
        this.find().where(['<', 'updatedAt', expired]).remove(cb);
    }

    removeByUserId (userId, cb) {
        this.find().where(['ID', 'userId', userId]).remove(cb);
    }
};