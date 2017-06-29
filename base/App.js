'use strict';

require('../helpers/init');

const Base = require('./Module');
const async = require('async');

module.exports = class App extends Base {

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {
                'formatter': {},
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
    // node bin/migrate.js --action apply --classes migrations/MigrationClass

    migrate (action, fileNames, cb) {
        if (action !== 'apply' && action !== 'revert') {
            this.log('error', `Migration action (apply or revert) is not set: ${action}`);
            return cb(true);
        }
        if (!(fileNames instanceof Array)) {
            fileNames = [fileNames];
        }
        async.eachSeries(fileNames, (fileName, cb)=> {
            this.log('info', `Start to ${action} ${fileName}`);
            this.migrateFile(fileName, action, err => {
                err ? this.log('error', `${fileName} is failed`, err)
                    : this.log('info', `${fileName} is done`);
                cb(err);
            });
        }, cb);
    }

    migrateFile (fileName, action, cb) {
        try {
            let Migration = require(this.getPath(fileName));
            let migration = new Migration;
            migration[action](cb);
        } catch (err) {
            cb(err);
        }
    }
};
module.exports.init();