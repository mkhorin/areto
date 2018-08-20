'use strict';

const Base = require('./SessionStore');

module.exports = class MemorySessionStore extends Base {

    constructor (config) {
        super(config);
        this._sessions = {};
        this._users = {};
    }
    
    get (sid, cb) {
        if (!Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            return cb(null, null);
        }
        if (this.session.lifetime && (new Date) - this._sessions[sid].updatedAt > this.session.lifetime) {
            return cb(null, null);
        }
        cb(null, this._sessions[sid].data);
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

    removeExpired (cb) {
        if (!this.session.lifetime) {
            return cb();
        }
        let now = new Date;
        for (let sid of Object.keys(this._sessions)) {
            if (now - this._sessions[sid].updatedAt > this.session.lifetime) {
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