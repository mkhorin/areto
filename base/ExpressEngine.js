/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ExpressEngine extends Base {

    constructor (config) {
        super(config);
        this._express = express();
        this._express.disable('x-powered-by');
        this._handlers = []; // for deferred assign
    }

    getExpress () {
        return this._express;
    }

    add (method, ...args) {
        this._handlers.push({method, args});
    }

    addChild (mountPath, express) {
        this.add('use', mountPath, express._express);
    }

    addViewEngine (params) {
        if (params) {
            this.add('engine', params.extension, params.engine);
            this.add('set', 'view engine', params.extension);
            this.add('set', 'views', params.views || '/');
        }
    }

    attach (method, ...args) {
        this._express[method](...args);
        this.log('trace', method, args[0]);
    }

    attachStatic (route, dir, options) {
        this.attach('use', route, express.static(dir, options));
        this.log('trace', 'static', dir);
    }

    attachChild (mountPath, express) {
        this.attach('use', mountPath, express._express);
    }

    attachHandlers () {
        for (const item of this._handlers) {
            this.attach(item.method, ...item.args);
        }
    }

    createServer () {
        return http.createServer(this._express);
    }

    log () {
        CommonHelper.log(this.module, this.constructor.name, ...arguments);
    }
};

const express = require('express');
const http = require('http');
const CommonHelper = require('../helper/CommonHelper');