'use strict';

const Base = require('../../base/Base');

module.exports = class Session extends Base {

    constructor (config) {
        super(Object.assign({            
            expressSession: session,
            resave: false,
            saveUninitialized: false,
            name: `${config.module.getFullName()}.sid`,
            store: require('./MemorySessionStore'),
            lifetime: 3600 // seconds
            //cookie: {maxAge: 3600 * 1000}
        }, config));
    }

    init () {
        this.lifetime *= 1000;
        this.store = ClassHelper.createInstance(this.store, {
            session: this
        });
        this.module.appendToExpress('use', session(this));
        this.module.appendToExpress('use', flash());
    }

    removeExpired (cb) {
        this.store.removeExpired(cb);
    }

    removeByUserId (userId, cb) {
        this.store.removeByUserId(userId, cb);
    }

    clear (cb) {
        this.store.clear(cb);
    }
};

const flash = require('connect-flash');
const session = require('express-session');
const ClassHelper = require('../../helpers/ClassHelper');