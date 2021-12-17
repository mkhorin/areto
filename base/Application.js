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

    async init () {
        await this.appEngine.init();
        await super.init();
        this.setBaseUrl();
    }

    getRoute (url) {
        if (this._route === undefined) {
            this._route = this.mountPath === '/' ? '' : this.mountPath;
        }
        return url ? `${this._route}/${url}` : this._route;
    }

    createName () {
        return StringHelper.toLowerCaseFirstLetter(StringHelper.trimEnd(this.constructor.name, 'Application'));
    }

    createFullName () {
        return this.name;
    }

    createInternalName () {
        return '';
    }

    setBaseUrl () {
        this.baseUrl = this.mountPath === '/' ? this.mountPath : `${this.mountPath}/`;
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
        this.log('info', `${this.getFullName()} app is attached to ${this.mountPath}`);
    }

    async startServer () {
        this.log('info', 'Starting server...');
        const params = {
            https: this.getConfig('https'),
            port: this.getServerPort()
        };
        await PromiseHelper.setImmediate();
        this.server = await this.startServerInternal(params);
        this.log('info', `Server is running on port ${this.server.address()?.port}`);
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