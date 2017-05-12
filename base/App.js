'use strict';

require('../helpers/init');

const Base = require('./Module');
const async = require('async');

module.exports = class App extends Base {

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {                
                'template': {},
                'bodyParser': {}
            },
            EVENT_START_APP: 'startApp'
        };
    }

    init () {
        super.init();
        this.urlCache = {};
    }

    configure (configName, cb) {
        super.configure(null, configName, err => {
            if (err) {
                console.error(`App: ${this.ID}:`, err);
                return cb(err);
            }
            cb();
        });
    }

    start (cb) {
        this.assignExpressQueue();
        this.createServer(cb);
    }

    createServer (cb) {
        let http = require('http');
        this.server = http.createServer(this.express).on('error', err => {
            this.log('error', 'Server error', err);
            cb(err);
        }).listen(this.config.port, ()=> {
            this.log('info', `${this.ID} started in ${this.configName}`, this.server.address());
            this.trigger(this.EVENT_START_APP);
            cb();
        });
    }

    // MIGRATION
    // node bin/migrate.js apply migrations/MigrationClass

    migrate (params, cb) {               
        let action = params.splice(0, 1).join('');        
        if (action !== 'apply' && action !== 'revert') {
            this.log('error', `Migration action (apply or revert) is not set: ${action}`);
            return cb(true);
        }
        async.eachSeries(params, (filename, cb)=> {
            this.log('info', `Start to ${action} ${filename}`);
            this.migrateFile(filename, action, err => {
                err ? this.log('error', `${filename} is failed`, err)
                    : this.log('info', `${filename} is done`);
                cb(err);
            });
        }, cb);
    }

    migrateFile (filename, action, cb) {
        try {
            let Migration = require(this.getPath(filename));
            let migration = new Migration;
            migration[action](cb);
        } catch (err) {
            cb(err);
        }
    }
};