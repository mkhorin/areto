'use strict';

let Base = require('../base/Base');
let helper = require('../helpers/MainHelper');
let session = require('express-session');
let flash = require('connect-flash');

module.exports = class Session extends Base {

    constructor (config) {
        super(Object.assign({            
            expressSession: session,
            resave: false,
            saveUninitialized: false,
            name: `${config.module.getFullName()}.sid`
        }, config));
    }

    init () {
        if (this.store) {
            this.store = helper.createInstance(this.store, {
                db: this.module.getDb()  
            });
        } 
        this.module.appendToExpress('use', session(this));
        this.module.appendToExpress('use', flash());
    }

    removeExpired (elapsedSeconds, cb) {
        if (this.store) {
            this.store.removeExpired(elapsedSeconds, cb);
        } else if (cb) {
            cb();
        }
    }

    removeByUserId (userId, cb) {
        if (this.store) {
            this.store.removeByUserId(userId, cb);
        } else if (cb) {
            cb();
        }
    }
};