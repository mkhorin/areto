/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class SessionStore extends Base {

    constructor (config) {
        super({
            userIdParam: '__id',
            ...config
        });
        Store.call(this);
    }

    createSession () {
        return Store.prototype.createSession.apply(this, arguments);
    }

    save () {
        return PromiseHelper.promise(Store.prototype.save, this);
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
const PromiseHelper = require('../../helper/PromiseHelper');

Object.assign(module.exports.prototype, Object.getPrototypeOf(Store.prototype));