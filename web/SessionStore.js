'use strict';

let Base = require('../base/Base');
let session = require('express-session');
let Store = session.Store;

module.exports = class SessionStore extends Base {

    constructor (config) {
        super(config);
        Store.call(this);
    }

    destroy (sid, cb) {
        cb('SessionStore: destroy: need to override');
    }

    clear (cb) {
        cb('SessionStore: clear: need to override');
    }

    get (sid, cb) {
        cb('SessionStore: get: need to override');
    }

    set (sid, session, cb) {
        cb('SessionStore: set: need to override');
    }

    touch (sid, session, cb) {
        cb('SessionStore: touch: need to override');
    }

    removeExpired (period, cb) {
        cb('SessionStore: removeExpired: need to override');
    }

    createSession (...args) {
        return Store.prototype.createSession.apply(this, args);
    }

    load (...args) {
        return Store.prototype.load.apply(this, args);
    }

    regenerate (...args) {
        return Store.prototype.regenerate.apply(this, args);
    }
};

Object.assign(module.exports.prototype, Object.getPrototypeOf(Store.prototype));