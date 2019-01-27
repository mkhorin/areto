/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Module');

module.exports = class App extends Base {

    static getConstants () {
        return {
            DEFAULT_COMPONENTS: {
                'bodyParser': {},
                'formatter': {},
                'url': {},
                'view': {}
            },
            EVENT_AFTER_START: 'afterStart'
        };
    }

    constructor (config) {
        super({
            ...config
        });
        this.mainExpress = this.createExpress();
        this._urlCache = {};
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

    setParent () {
        this.app = this;
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
        this.mainExpress.attachChild(this.mountPath, this.express);
    }

    createServer () {
        return new Promise((resolve, reject)=> {
            this.server = this.mainExpress.createServer().on('error', err => {
                this.log('error', 'Server error', err);
                reject(err);
            }).listen(this.getConfig('port'), ()=> {
                this.log('info', `Started as`, this.server.address());
                this.log('info', `Mounted as ${this.mountPath}`);
                this.afterStart().then(resolve);
            });
        });
    }
};
module.exports.init();