/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class Session extends Base {

    /**
     * @param {Object} config
     * @param {boolean} config.resave - Force to resave unchanged session data
     * @param {boolean} config.saveUninitialized - Force to save a new session with unchanged data
     * @param {string} config.name - Session ID cookie name
     * @param {number|string} config.lifetime - In seconds or ISO_8601#Duration. Zero is an infinite lifetime
     * @param {Object} config.cookie - Options for session ID cookie
     * @param {number} config.cookie.maxAge - In milliseconds
     * @param {boolean} config.cookie.httpOnly - By default, this is true
     * @param {string} config.cookie.path -  By default, this is the root path
     * @param {boolean|string} config.cookie.sameSite -  By default, this is false
     * @param {boolean|string} config.cookie.secure - It requires https. By default, this is false
     * @param {string|Array} config.secret - Key to sign session ID cookie
     */
    constructor (config) {
        super({
            resave: false,
            saveUninitialized: false,
            name: config.module.getFullName() + '.sid',
            lifetime: 'PT1H',
            Store: require('./MemorySessionStore'),
            engine: require('express-session'),
            flash: require('connect-flash'),
            ...config
        });
    }

    init () {
        this.cookie = Object.assign(this.getDefaultCookieOptions(), this.cookie);
        this.lifetime = DateHelper.parseDuration(this.lifetime);
        this.store = this.spawn(this.Store, {session: this});
        this.module.addHandler('use', this.engine(this));
        this.module.addHandler('use', this.flash());
    }

    isExpired (date) {
        return this.lifetime > 0 && Date.now() - date?.getTime() > this.lifetime;
    }

    getExpiryDate (date) {
        return this.lifetime
            ? new Date(date?.getTime() + this.lifetime)
            : null;
    }

    getDefaultCookieOptions () {
        return {
            sameSite: 'strict'
        };
    }

    deleteExpired () {
        return this.store.deleteExpired(...arguments);
    }

    deleteById () {
        return this.store.deleteById(...arguments);
    }

    deleteByUserId () {
        return this.store.deleteByUserId(...arguments);
    }

    clear () {
        return this.store.clear(...arguments);
    }
};

const DateHelper = require('../../helper/DateHelper');