'use strict';

const Base = require('../../base/Base');

module.exports = class ViewAsset extends Base {

    init () {
        this._bundleMap = {};
        this._bundles = [];
    }

    add (data) {
        if (typeof data !== 'string') {
            let item = this.manager.createBundle(data);
            if (!this.hasBundle(item.name)) {
                this._bundleMap[item.name] = item;
                this._bundles.push(item);
            }
        } else if (!this.hasBundle(data)) {
            let item = this.manager.getBundle(data);
            if (!item) {
                return this.log('error', `Unknown asset name: ${data}`);
            }
            this._bundleMap[data] = item;
            this._bundles.push(item);
        }
    }

    createPosition (pos) {
        if (this._positions) {
            this._positions[pos] = true;
        } else {
            this._positions = {[pos]: true};
        }
        return `#asset{${pos}}`;
    }

    render (content) {
        if (!this._positions) {
            return content;
        }
        this.resolveBundles();
        let anchors = Object.keys(this._positions).join('|');
        return content.replace(new RegExp(`#asset{(${anchors})}`, 'g'), this.renderPosition.bind(this));
    }

    renderPosition (match, pos) {
        let result = '';
        for (let bundle of this._resolvedBundles) {
            result += bundle.render(pos);
        }
        return result;
    }

    hasBundle (name) {
        return Object.prototype.hasOwnProperty.call(this._bundleMap, name);
    }

    getBundle (name) {
        return this.hasBundle(name) ? this._bundleMap[name] : this.manager.getBundle(name);
    }

    resolveBundles () {
        this._processedNames = {};
        this._resolvedBundles = new Set;
        for (let bundle of this._bundles) {
            this.processBundle(bundle);
        }
    }

    processBundle (bundle) {
        if (this._resolvedBundles.has(bundle)) {
            return;
        }
        if (this._processedNames[bundle.name] === true) {
            return this.logCircularDependency(bundle);
        }
        this._processedNames[bundle.name] = true;
        if (bundle.depends instanceof Array) {
            for (let name of bundle.depends) {
                let item = this.getBundle(name);
                if (!item) {
                    return this.log('error', `Unknown depends name: ${name}`);
                }
                this.processBundle(item);
            }
        }
        this._processedNames[bundle.name] = false;
        this._resolvedBundles.add(bundle);
    }

    logCircularDependency (bundle) {
        let names = this._processedNames;
        names = Object.keys(names).filter(key => names[key] === true);
        this.log('error', `Circular dependency: ${names.join()},${bundle.name}`);
    }

    log (type, message, data) {
        this.manager.log(type, this.wrapClassMessage(message), data);
    }
};

const AssetBundle = require('./AssetBundle');