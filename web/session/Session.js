/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Session extends Base {

    constructor (config) {
        super({            
            'expressSession': session,
            'resave': false,
            'saveUninitialized': false,
            'name': `${config.module.getFullName()}.sid`,
            'store': require('./MemorySessionStore'),
            'lifetime': 3600, // seconds
            //'cookie': {maxAge: 3600 * 1000},
            ...config
        });
        this.lifetime *= 1000;
    }

    init () {
        this.store = ClassHelper.createInstance(this.store, {
            'session': this
        });
        this.module.addHandler('use', session(this));
        this.module.addHandler('use', flash());
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

const flash = require('connect-flash');
const session = require('express-session');
const ClassHelper = require('../../helper/ClassHelper');