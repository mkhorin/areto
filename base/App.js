'use strict';

require('../init');

const Base = require('./Module');

module.exports = class App extends Base {

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {
                'formatter': {},
                'view': {},
                'bodyParser': {}
            },
            EVENT_AFTER_START: 'afterStart'
        };
    }

    init () {
        super.init();
        this._urlCache = {};
        this._baseExpress = express();

    }

    configure (configName, cb) {
        super.configure(null, configName, err => {
            if (err) {
                console.error(`App: ${this.NAME}:`, err);
                return cb(err);
            }
            this.baseUrl = this.mountPath === '/' ? this.mountPath : `${this.mountPath}/`;
            setImmediate(cb);
        });
    }

    getRoute (url) {
        if (this._route === undefined) {
            this._route = this.mountPath === '/' ? '' : this.mountPath;
        }
        return url ? `${this._route}/${url}` : this._route;
    }

    start (cb) {
        this.assignExpressQueue();
        this.createServer(cb);
    }

    useBaseExpressHandler () {
        this._baseExpress.use.apply(this._baseExpress, arguments);
    }

    assignExpressQueue () {
        super.assignExpressQueue();
        this._baseExpress.use(this.mountPath, this._express);
    }

    createServer (cb) {
        this.server = http.createServer(this._baseExpress).on('error', err => {
            this.log('error', 'Server error', err);
            cb(err);
        }).listen(this.config.port, ()=> {
            this.log('info', `Mounted as ${this.mountPath}`);
            this.log('info', `Started as ${this.configName}`, this.server.address());
            this.afterStart(cb);
        });
    }

    getUrlFromCache (key) {
        return this._urlCache[key];
    }

    setUrlToCache (url, key) {
        this._urlCache[key] = url;
    }

    // EVENTS

    afterStart (cb) {
        this.triggerCallback(this.EVENT_AFTER_START, cb);
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
        AsyncHelper.eachSeries(fileNames, (fileName, cb)=> {
            this.log('info', `Start to ${action} ${fileName}`);
            this.migrateFile(fileName, action, err => {
                err ? this.log('error', `Failed: ${fileName}`, err)
                    : this.log('info', `Done: ${fileName}`);
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

const express = require('express');
const http = require('http');
const AsyncHelper = require('../helper/AsyncHelper');