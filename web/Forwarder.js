/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Forwarder extends Base {

    constructor (config) {
        super(Object.assign({
            Url: require('./Url'),
            items: {}
        }, config));

        this.setItems();
    }

    setItems (items) {
        this._urls = [];
        try {
            for (let source of Object.keys(this.items)) {
                let item = this.items[source];
                item = item instanceof Object ? item : {target: item};
                item.source = source;
                this._urls.push(new this.Url(item));
                this.log('trace', `${this.module.getFullName()}: forward ${item.source} to ${item.target}`);
            }    
        } catch (err) {
            this.log('error', 'setItems', err);
        }        
    }

    forward (req) {
        let data = this.resolve(req.path, req.method);
        if (data) {
            this.log('trace', `${this.module.getFullName()}: forward ${req.path} to ${data.path}`, data.params);
            Object.assign(req.query, data.params);
            req.url = data.path;
        }
    }

    resolve (path, method) {
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
};