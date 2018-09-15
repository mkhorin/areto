/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('./SessionStore');

module.exports = class MemorySessionStore extends Base {

    constructor (config) {
        super(config);
        this._sessions = {};
        this._users = {};
    }

    get (sid, callback) {
        if (!Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            return callback(null, null);
        }
        if (this.session.lifetime && (new Date) - this._sessions[sid].updatedAt > this.session.lifetime) {
            return callback(null, null);
        }
        callback(null, this._sessions[sid].data);
    }

    set (sid, session, callback) {
        this._sessions[sid] = {
            data: session,
            updatedAt: new Date
        };
        if (session[this.userIdParam]) {
            this._users[session[this.userIdParam]] = sid;
        }
        callback();
    }

    touch (sid, session, callback) {
        if (Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            this._sessions[sid].updatedAt = new Date;
        }
        callback();
    }

    removeExpired (callback) {
        if (!this.session.lifetime) {
            return callback();
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
        callback();
    }

    removeByUserId (userId, callback) {
        if (Object.prototype.hasOwnProperty.call(this._users, userId)) {
            delete this._sessions[this._users[userId]];
            delete this._users[userId];
        }
        callback();
    }

    destroy (sid, callback) {
        if (Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            if (this._sessions[sid][this.userIdParam]) {
                delete this._users[this._sessions[sid][this.userIdParam]];
            }
            delete this._sessions[sid];
        }
        callback();
    }

    clear (callback) {
        this._sessions = {};
        this._users = {};
        callback();
    }
};