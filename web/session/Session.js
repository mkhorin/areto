/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class Session extends Base {

    /**
     * @param {Object} config
     * @param {number|string} config.lifetime - In seconds or ISO_8601#Duration
     * @param {Object} config.cookie - Cookie options: {maxAge: 3600 * 1000, ...}
     * @param {string} config.secret - Key to sign session ID cookie
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

    getDefaultCookieOptions () {
        return {
            sameSite: 'strict'
        };
    }

    deleteExpired () {
        return this.store.deleteExpired();
    }

    deleteByUserId (id) {
        return this.store.deleteByUserId(id);
    }

    clear () {
        return this.store.clear();
    }
};

const DateHelper = require('../../helper/DateHelper');