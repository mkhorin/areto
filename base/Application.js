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
        this.mainEngine = this.createEngine();
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

    start () {
        this.attachHandlers();
        return this.createServer();
    }

    afterStart () {
        return this.trigger(this.EVENT_AFTER_START);
    }

    attachHandlers () {
        super.attachHandlers();
        this.mainEngine.attachChild(this.mountPath, this.engine);
    }

    createServer () {
        return new Promise((resolve, reject) => {
            this.server = this.mainEngine.createServer().on('error', err => {
                this.log('error', 'Server error', err);
                reject(err);
            }).listen(this.getConfig('port'), ()=> {
                this.log('info', `Started ${this.fullName} as`, this.server.address());
                this.log('info', `Mounted ${this.fullName} as ${this.mountPath}`);
                this.afterStart().then(resolve);
            });
        });
    }
};
module.exports.init();

const StringHelper = require('../helper/StringHelper');