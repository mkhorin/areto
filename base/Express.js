/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Express extends Base {

    constructor (config) {
        super({
            ...config
        });
        this._express = express();
        this._handlers = []; // for deferred assign
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
        this._express[method].apply(this._express, args);
        this.log('trace', method, args[0]);
    }

    attachStatic (route, dir, options) {
        return this.attach('use', route, express.static(dir, options));
    }

    attachChild (mountPath, express) {
        this.attach('use', mountPath, express._express);
    }

    attachHandlers () {
        for (let item of this._handlers) {
            this.attach.apply(this, [item.method].concat(item.args));
        }
    }

    createServer () {
        return http.createServer(this._express);
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.module);
    }
};

const fs = require('fs');
const express = require('express');
const http = require('http');
const CommonHelper = require('../helper/CommonHelper');