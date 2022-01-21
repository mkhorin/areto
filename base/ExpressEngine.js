/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ExpressEngine extends Base {

    init () {
        this._express = express();
        this._express.disable('x-powered-by');
        this._handlers = []; // for deferred assignments
    }

    add (method, ...args) {
        this._handlers.push({method, args});
    }

    addChild (mountPath, engine) {
        this.add('use', mountPath, engine._express);
    }

    addViewEngine (params) {
        if (params) {
            this.add('engine', params.extension, params.engine);
            this.add('set', 'view engine', params.extension);
            this.add('set', 'views', params.views || '/');
        }
    }

    attachChild (mountPath, engine) {
        this.attach('use', mountPath, engine._express);
    }

    attachHandlers () {
        for (const item of this._handlers) {
            this.attach(item.method, ...item.args);
        }
    }

    attachStatic (route, dir, options) {
        this.attach('use', route, express.static(dir, options));
        this.log('info', 'static', dir);
    }

    attach (method, ...args) {
        this._express[method](...args);
        this.log('info', method, args[0]);
    }

    createHttpServer () {
        return http.createServer(this._express);
    }

    startHttpServer ({port}) {
        const server = require('http').createServer(this._express);
        return this.listenServer(port, server);
    }

    startHttpsServer ({https, port}) {
        const server = require('https').createServer(https, this._express);
        return this.listenServer(port, server);
    }

    listenServer (port, server) {
        return new Promise((resolve, reject) => {
            server.on('error', reject).listen(port, () => resolve(server));
        });
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const express = require('express');
const CommonHelper = require('../helper/CommonHelper');