/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Forwarder extends Base {

    constructor (config) {
        super({
            items: {},
            Url: require('./Url'),
            ...config
        });
        this.clear();
    }

    init () {
        this.createItems();
        if (!this.isEmpty()) {
            this.module.addHandler('use', this.forward.bind(this));
        }
    }

    isEmpty () {
        return this._urls.length === 0;
    }

    createItems () {
        this._urls = [];
        for (const source of Object.keys(this.items)) {
            let data = this.items[source];
            data = data instanceof Object ? data : {target: data};
            data.source = source;
            this._urls.push(ClassHelper.spawn(this.Url, data));
            this.log('trace', `forward ${data.source} to ${data.target}`);
        }
    }

    forward (req, res, next) {
        const data = this.resolvePath(req.path, req.method);
        if (!data) {
            return next();
        }
        this.log('trace', `forward ${req.path} to ${data.path}`, data.params);
        Object.assign(req.query, data.params);
        req.url = data.path;
        next();
    }

    resolve (url) {
        let newUrl = this.get(url);
        if (newUrl) {
            return newUrl;
        }
        newUrl = this.createSourceUrl(UrlHelper.parse(url));
        if (!newUrl && this.module.parent) {
            newUrl = this.module.parent.resolveUrl(url);
        }
        this.set(url, newUrl);
        return newUrl;
    }

    resolvePath (path, method) {
        for (const url of this._urls) {
            const data = url.resolve(path, method);
            if (data) {
                return data;
            }
        }
        return null;
    }

    createSourceUrl (data) {
        const index = data.segments.indexOf(this.module.getRouteName()) + 1;
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

const ClassHelper = require('../helper/ClassHelper');
const UrlHelper = require('../helper/UrlHelper');