/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class Session extends Base {

    constructor (config) {
        super({
            resave: false,
            saveUninitialized: false,
            name: config.module.getFullName() + '.sid',
            lifetime: 'PT1H', // see ISO_8601#Duration
            // cookie: {maxAge: 3600 * 1000},
            // secret: 'key', // key to sign session ID cookie
            Store: require('./MemorySessionStore'),
            engine: require('express-session'),
            flash: require('connect-flash'),
            ...config
        });
    }

    init () {
        this.lifetime = DateHelper.parseDuration(this.lifetime);
        this.store = this.spawn(this.Store, {session: this});
        this.module.addHandler('use', this.engine(this));
        this.module.addHandler('use', this.flash());
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