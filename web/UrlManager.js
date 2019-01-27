/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class UrlManager extends Base {

    constructor (config) {
        super({
            ...config
        });
    }

    init () {
        this.forwarder = this.module.get('forwarder');
    }

    /**
     * @param url
     * @param root - controller or module
     */
    resolve (url, root) {
        return this.forward(this.create(url, root));
    }

    forward (url) {
        return this.forwarder ? this.forwarder.resolve(url) : url;
    }

    /**
     * @param url - ['action', { param1: param1, param2: param2 }]
     *  /module/controller/action - relative app
     *  controller/action - relative module
     *  action - relative controller
     * @param root - controller or module
     */
    create (url, root) {
        let params, anchor;
        if (url instanceof Array) {
            params = url[1];
            url = url[0];
        }
        let index = url.indexOf('/');
        if (index === -1) { // relative root
            url = this.module.getRoute(root ? `${root.NAME}/${url}` : url);
        } else if (index === 0) { // relative app
            let root = this.module.app.mountPath;
            if (root !== '/') {
                if (url.substring(0, root.length) !== root) {
                    url = root + url;
                }
            }
        } else if (url.substring(0, 4) !== 'http') { // relative module
            url = this.module.getRoute(url);
        }
        if (params instanceof ActiveRecord) {
            params = `id=${params.getId()}`;
        } else if (typeof params === 'object' && params) {
            anchor = params['#'];
            delete params['#'];
            params = this.serializeParams(params);
        }
        if (params) {
            url += '?'+ params;
        }
        if (anchor !== undefined) {
            url += '#'+ anchor;
        }
        return url;
    }

    serializeParams (params) {
        if (!params) {
            return '';
        }
        let result = [];
        for (let key of Object.keys(params)) {
            if (params[key] !== undefined && params[key] !== null) {
                result.push(key +'='+ params[key]);
            }
        }
        return result.join('&');
    }

    parse (url) {
        let parts = url.split('?');
        let segments = parts[0].replace(/^\/|\/$/g, '').split('/');
        let params = {}, anchor;
        if (parts[1]) {
            parts = parts[1].split('#');
            anchor = parts[1];
            for (let param of parts[0].split('&')) {
                parts = param.split('=');
                params[parts[0]] = parts[1];
            }
        }
        return {segments, params, anchor};
    }
};

const ActiveRecord = require('../db/ActiveRecord');