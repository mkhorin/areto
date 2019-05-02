/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Forwarder extends Base {

    constructor (config) {
        super({
            'Url': require('./Url'),
            'items': {},
            ...config
        });
        this.clear();
    }

    init () {
        this.urlManager = this.module.get('url');
        this.createItems();
        if (!this.isEmpty()) {
            this.module.express.attach('use', this.forward.bind(this));
        }
    }

    isEmpty () {
        return this._urls.length === 0;
    }

    createItems (items) {
        this._urls = [];
        for (let source of Object.keys(this.items)) {
            let data = this.items[source];
            data = data instanceof Object ? data : {target: data};
            data.source = source;
            this._urls.push(ClassHelper.spawn(this.Url, data));
            this.log('trace', `${this.module.getFullName()}: forward ${data.source} to ${data.target}`);
        }
    }

    forward (req, res, next) {
        let data = this.resolvePath(req.path, req.method);
        if (data) {
            this.log('trace', `${this.module.getFullName()}: forward ${req.path} to ${data.path}`, data.params);
            Object.assign(req.query, data.params);
            req.url = data.path;
        }
        next();
    }

    resolve (url) {
        let newUrl = this.get(url);
        if (!newUrl) {
            newUrl = this.createSourceUrl(this.urlManager.parse(url));
            if (!newUrl && this.module.parent) {
                newUrl = this.module.parent.resolveUrl(url);
            }
            this.set(url, newUrl);
        }
        return newUrl;
    }

    resolvePath (path, method) {
        for (let url of this._urls) {
            let data = url.resolve(path, method);
            if (data) {
                return data;
            }
        }
        return null;
    }

    createSourceUrl (data) {
        let index = data.segments.indexOf(this.module.NAME) + 1;
        data.path = index > 0
            ? `/${data.segments.slice(index).join('/')}`
            : `/${data.segments.join('/')}`;
        for (let url of this._urls) {
            url = url.createSourceUrl(data);
            if (url) {
                return index > 0 ? `/${data.segments.slice(0, index).join('/')}${url}` : url;
            }
        }
        return null;
    }

    // CACHE

    get (key) {
        return Object.prototype.hasOwnProperty.call(this._cache, key)
            ? this._cache[key]
            : null;
    }

    set (key, value) {
        this._cache[key] = value;
    }

    clear () {
        this._cache = {};
    }
};