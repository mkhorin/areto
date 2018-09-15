/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class SessionStore extends Base {

    constructor (config) {
        super(Object.assign({
            userIdParam: '__id'
        }, config));

        Store.call(this);
    }

    createSession () {
        return Store.prototype.createSession.apply(this, arguments);
    }

    load () {
        return Store.prototype.load.apply(this, arguments);
    }

    regenerate () {
        return Store.prototype.regenerate.apply(this, arguments);
    }
};

const session = require('express-session');
const Store = session.Store;

Object.assign(module.exports.prototype, Object.getPrototypeOf(Store.prototype));