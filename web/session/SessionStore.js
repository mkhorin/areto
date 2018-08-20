'use strict';

const Base = require('../../base/Base');

module.exports = class SessionStore extends Base {

    constructor (config) {
        super(Object.assign({
            userIdParam: '__id'
        }, config));

        Store.call(this);
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

const session = require('express-session');
const Store = session.Store;

Object.assign(module.exports.prototype, Object.getPrototypeOf(Store.prototype));