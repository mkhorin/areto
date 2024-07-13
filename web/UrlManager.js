/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class UrlManager extends Base {

    init () {
        this.serverAddress = this.module.params.serverAddress;
    }

    resolve () {
        return this.create(...arguments);
    }

    resolveAbsolute () {
        return this.serverAddress + this.resolve(...arguments);
    }

    createAbsolute () {
        return this.serverAddress + this.create(...arguments);
    }

    /**
     * /module/controller/action - relative to app
     * controller/action - relative to module
     * action - relative to controller
     * @param {string|Array} data - ['action', { k1: param1, k2: param2 }]
     * @param {string} root - Controller or module name
     */
    create (data, root) {
        let params;
        if (Array.isArray(data)) {
            params = data[1];
            data = data[0];
        }
        const index = data.indexOf('/');
        if (index === -1) { // relative to root
            data = this.module.getRoute(root ? `${root}/${data}` : data);
        } else if (index === 0) { // relative to app
            root = this.module.app.mountPath;
            if (root !== '/' && data.substring(0, root.length) !== root) {
                data = root + data;
            }
        } else if (data.indexOf('http') !== 0) { // relative to module
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