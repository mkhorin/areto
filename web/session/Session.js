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
            name: `${config.module.getFullName()}.sid`,
            lifetime: 3600, // seconds
            // cookie: {maxAge: 3600 * 1000},
            Store: require('./MemorySessionStore'),
            engine: require('express-session'),
            flash: require('connect-flash'),
            ...config
        });
        this.lifetime *= 1000;
    }

    init () {
        this.store = this.spawn(this.Store, {session: this});
        this.module.addHandler('use', this.engine(this));
        this.module.addHandler('use', this.flash());
    }

    removeExpired () {
        return this.store.removeExpired();
    }

    removeByUserId (userId) {
        return this.store.removeByUserId(userId);
    }

    clear () {
        return this.store.clear();
    }
};