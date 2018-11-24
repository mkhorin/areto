/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

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

    constructor () {
        super();
        this._urlCache = {};
        this._baseExpress = express();
    }

    setParent () {
        this.app = this;
    }

    async init (config) {
        await super.init(config);
        this.baseUrl = this.mountPath === '/' ? this.mountPath : `${this.mountPath}/`;
    }

    getRoute (url) {
        if (this._route === undefined) {
            this._route = this.mountPath === '/' ? '' : this.mountPath;
        }
        return url ? `${this._route}/${url}` : this._route;
    }

    start () {
        this.assignExpressQueue();
        return this.createServer();
    }

    useBaseExpressHandler () {
        this._baseExpress.use.apply(this._baseExpress, arguments);
    }

    assignExpressQueue () {
        super.assignExpressQueue();
        this._baseExpress.use(this.mountPath, this._express);
    }

    createServer () {
        return new Promise((resolve, reject)=> {
            this.server = http.createServer(this._baseExpress).on('error', err => {
                this.log('error', 'Server error', err);
                reject(err);
            }).listen(this.getConfig('port'), ()=> {
                this.log('info', `Started as`, this.server.address());
                this.log('info', `Mounted as ${this.mountPath}`);
                this.afterStart().then(resolve);
            });
        });
    }

    getUrlFromCache (key) {
        return this._urlCache[key];
    }

    setUrlToCache (url, key) {
        this._urlCache[key] = url;
    }

    // EVENTS

    afterStart () {
        return this.trigger(this.EVENT_AFTER_START);
    }

    // MIGRATION
    // node bin/migrate.js --action apply --file migrations/MigrationClass

    async migrate (action, files) {
        if (action !== 'apply' && action !== 'revert') {
            throw new Error(`Migration action (apply or revert) is not set: ${action}`);
        }
        if (!(files instanceof Array)) {
            return this.createMigration(files, action);
        }
        for (let file of files) {
            await this.createMigration(file, action);
        }
    }

    async createMigration (file, action) {
        this.log('info', `Start to ${action} ${file}`);
        let Migration = require(this.getPath(file));
        let migration = new Migration;
        await migration[action]();
        this.log('info', `Done: ${file}`);
    }
};
module.exports.init();

const express = require('express');
const http = require('http');