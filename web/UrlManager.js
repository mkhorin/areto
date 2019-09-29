/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class UrlManager extends Base {

    constructor (config) {
        super({
            forwarder: 'forwarder',
            ...config
        })
    }

    init () {
        this.forwarder = this.module.get(this.forwarder);
        this.serverAddress = this.module.getParam('serverAddress');
    }

    resolveAbsolute () {
        return this.serverAddress + this.resolve(...arguments);
    }

    resolve () {
        return this.forward(this.create(...arguments));
    }

    forward (url) {
        return this.forwarder ? this.forwarder.resolve(url) : url;
    }

    createAbsolute () {
        return this.serverAddress + this.create(...arguments);
    }

    /**
     * @param data - ['action', { k1: param1, k2: param2 }]
     *  /module/controller/action - relative app
     *  controller/action - relative module
     *  action - relative controller
     * @param root - [controller or module name]
     */
    create (data, root) {
        let params;
        if (Array.isArray(data)) {
            params = data[1];
            data = data[0];
        }
        const index = data.indexOf('/');
        if (index === -1) { // relative root
            data = this.module.getRoute(root ? `${root}/${data}` : data);
        } else if (index === 0) { // relative app
            root = this.module.app.mountPath;
            if (root !== '/' && data.substring(0, root.length) !== root) {
                data = root + data;
            }
        } else if (data.substring(0, 4) !== 'http') { // relative module
            data = this.module.getRoute(data);
        }
        if (!params || typeof params !== 'object') {
            return data;
        }
        if (params.getId) {
            return data + '?id=' + params.getId();
        }
        const anchor = params['#'];
        delete params['#'];
        params = UrlHelper.serialize(params);
        if (params) {
            data += '?' + params;
        }
        if (anchor !== undefined) {
            data += '#' + anchor;
        }
        return data;
    }
};

const UrlHelper = require('../helper/UrlHelper');