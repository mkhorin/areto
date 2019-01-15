/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class ModuleUrl extends Base {

    constructor (config) {
        super({
            'Url': require('./Url'),
            'forwarder': 'forwarder',
            ...config
        });        
        this.forwarder = this.module.components.get(this.forwarder); 
        this.clear();
    }

    resolve (url) {
        let newUrl = this.get(url);
        if (newUrl === null) {
            newUrl = this.Url.parse(url);            
            newUrl = this.resolveSource(newUrl) || url;
            this.set(url, newUrl);
        }
        return newUrl;
    }

    resolveSource (data) {
        return (this.forwarder && this.forwarder.createSourceUrl(data))
            || (this.module.parent && this.module.parent.resolveSource(data));
    }
    
    get (key) {
        return Object.prototype.hasOwnProperty.call(this._cache, key) ? this._cache[key] : null;   
    }

    set (key, value) {
        this._cache[key] = value;
    }
    
    clear () {
        this._cache = {};
    }
};