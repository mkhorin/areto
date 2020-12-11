/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Module');

module.exports = class Application extends Base {

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {
                'bodyParser': {},
                'formatter': {},
                'router': {},
                'urlManager': {},
                'view': {}
            },
            EVENT_AFTER_START: 'afterStart'
        };
    }

    constructor (config) {
        super(config);
        this.configName = this.configName || process.env.NODE_ENV;
        this.appEngine = this.createEngine();
    }

    getBaseName () {
        if (!this.hasOwnProperty('_baseName')) {
            this._baseName = StringHelper.camelToId(StringHelper.trimEnd(this.constructor.name, 'Application'));
        }
        return this._baseName;
    }

    async init () {
        await super.init();
        this.baseUrl = this.mountPath === '/' ? this.mountPath : `${this.mountPath}/`;
    }

    getRoute (url) {
        if (this._route === undefined) {
            this._route = this.mountPath === '/' ? '' : this.mountPath;
        }
        return url ? `${this._route}/${url}` : this._route;
    }

    createFullName () {
        return this.getBaseName();
    }

    createRelativeName () {
        return '';
    }

    async start () {
        this.attachHandlers();
        await this.startServer();
        await this.afterStart();
    }

    afterStart () {
        return this.trigger(this.EVENT_AFTER_START);
    }

    attachHandlers () {
        super.attachHandlers();
        this.appEngine.attachChild(this.mountPath, this.engine);
    }

    async startServer () {
        this.log('info', 'Starting server...');
        const params = {
            https: this.getConfig('https'),
            port: this.getServerPort()
        };
        await PromiseHelper.setImmediate();
        this.server = await this.startServerInternal(params);
        this.log('info', `Started ${this.fullName} as`, this.server.address());
        this.log('info', `Mounted ${this.fullName} as ${this.mountPath}`);
    }

    getServerPort () {
        return this.serverPort || this.getConfig('port');
    }

    startServerInternal (params) {
        return params.https
            ? this.appEngine.startHttpsServer(params)
            : this.appEngine.startHttpServer(params);
    }
};
module.exports.init();

const PromiseHelper = require('../helper/PromiseHelper');
const StringHelper = require('../helper/StringHelper');