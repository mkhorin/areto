'use strict';

const Base = require('../base/Base');
const Url = require('./Url');

module.exports = class Forwarder extends Base {

    init () {        
        this.setItems(this.items || {});
    }

    setItems (items) {
        this.urls = [];
        try {
            for (let source of Object.keys(items)) {
                let item = items[source];
                item = item instanceof Object ? item : {target: item};
                item.source = source;
                this.urls.push(new Url(item));
                this.module.log('trace', `${this.module.getFullName()}: forward ${item.source} to ${item.target}`);
            }    
        } catch (err) {
            this.module.log('error', 'Forwarder: setItems', err);
        }        
    }

    forward (req) {
        var data = this.resolve(req.path, req.method);
        if (data) {
            this.module.log('trace', `${this.module.getFullName()}: forward ${req.path} to ${data.path}`, data.params);
            Object.assign(req.query, data.params);
            req.url = data.path;
        }
    }

    resolve (path, method) {
        for (let url of this.urls) {
            let data = url.resolve(path, method);
            if (data) return data;
        }
        return null;
    }

    createSourceUrl (data) {
        let index = data.segments.indexOf(this.module.ID) + 1;
        data.path = index > 0
            ? `/${data.segments.slice(index).join('/')}`
            : `/${data.segments.join('/')}`;
        for (let url of this.urls) {
            url = url.createSourceUrl(data);
            if (url) {
                return index > 0 ? `/${data.segments.slice(0, index).join('/')}${url}` : url;
            }
        }
        return null;
    }
};