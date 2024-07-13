/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Forwarder extends Base {

    _items = [];

    /**
     * @param {Object} config
     * @param {Object} config.items - Forwarding list: [source]: [target]
     */
    constructor (config) {
        super({
            items: {},
            Item: ForwarderItem,
            ...config
        });
    }

    init () {
        this._items = this.createItems();
        if (!this.isEmpty()) {
            this.module.addHandler('use', this.redirect.bind(this));
        }
    }

    isEmpty () {
        return this._items.length === 0;
    }

    createItems () {
        const items = [];
        for (const key of Object.keys(this.items)) {
            const item = this.createItem(key, this.items[key]);
            items.push(item);
            this.log('info', item.getCreationMessage());
        }
        return items;
    }

    createItem (source, target) {
        const params = target.target ? {...target} : {target};
        if (!params.source) {
            params.source = source;
        }
        return ClassHelper.spawn(this.Item, params);
    }

    redirect (req, res, next) {
        const data = this.resolveTarget(req.path, req.method);
        if (!data) {
            return next();
        }
        const {path, params} = data;
        this.log('trace', `Redirect ${req.path} to ${path}`, params);
        Object.assign(req.query, params);
        req.url = path;
        next();
    }

    resolveTarget (path, method) {
        for (const item of this._items) {
            const data = item.resolveTarget(path, method);
            if (data) {
                return data;
            }
        }
    }
};

const ClassHelper = require('../helper/ClassHelper');
const ForwarderItem = require('./ForwarderItem');