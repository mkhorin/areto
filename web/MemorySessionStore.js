'use strict';

const Base = require('./SessionStore');

module.exports = class MemorySessionStore extends Base {

    constructor (config) {
        super(Object.assign({
            userIdParam: '__id'
        }, config));
        
        this._sessions = {};
        this._users = {};
    }
    
    get (sid, cb) {
        cb(null, Object.prototype.hasOwnProperty.call(this._sessions, sid) 
            ? this._sessions[sid].data : null);
    }

    set (sid, session, cb) {
        this._sessions[sid] = {
            data: session,
            updatedAt: new Date
        };
        if (session[this.userIdParam]) {
            this._users[session[this.userIdParam]] = sid;
        }
        cb();
    }

    touch (sid, session, cb) {
        if (Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            this._sessions[sid].updatedAt = new Date;             
        }
        cb();
    }

    removeExpired (elapsedSeconds, cb) {
        let expired = new Date;
        expired.setSeconds(expired.getSeconds() - elapsedSeconds);
        for (let sid of Object.keys(this._sessions)) {
            if (this._sessions[sid].updatedAt < expired) {
                if (this._sessions[sid][this.userIdParam]) {
                    delete this._users[this._sessions[sid][this.userIdParam]];
                }
                delete this._sessions[sid]; 
            }
        }
        cb();
    }

    removeByUserId (userId, cb) {
        if (Object.prototype.hasOwnProperty.call(this._users, userId)) {            
            delete this._sessions[this._users[userId]];
            delete this._users[userId];
        }
        cb();
    }
    
    destroy (sid, cb) {
        if (Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            if (this._sessions[sid][this.userIdParam]) {
                delete this._users[this._sessions[sid][this.userIdParam]];
            }
            delete this._sessions[sid];
        }
        cb();
    }

    clear (cb) {
        this._sessions = {};
        this._users = {};
        cb();
    }
};

const Query = require('../db/Query');