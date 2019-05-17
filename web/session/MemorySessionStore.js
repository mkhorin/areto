/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SessionStore');

module.exports = class MemorySessionStore extends Base {

    _sessions = {};
    _users = {};

    get (sid, callback) {
        if (Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            let item = this._sessions[sid];
            if (!this.session.lifetime || (new Date) - item.updatedAt < this.session.lifetime) {
                return callback(null, item.data);
            }
        }
        return callback(null, undefined);
    }

    set (sid, data, callback) {
        this._sessions[sid] = {updatedAt: new Date, data};
        if (data[this.userIdParam]) {
            this._users[data[this.userIdParam]] = sid;
        }
        callback();
    }

    touch (sid, data, callback) {
        if (Object.prototype.hasOwnProperty.call(this._sessions, sid)) {
            this._sessions[sid].updatedAt = new Date;
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

    removeExpired () {
        if (!this.session.lifetime) {
            return null;
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
    }

    removeByUserId (userId) {
        if (Object.prototype.hasOwnProperty.call(this._users, userId)) {
            delete this._sessions[this._users[userId]];
            delete this._users[userId];
        }
    }
};