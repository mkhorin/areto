/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class ViewAsset extends Base {

    _bundles = new DataMap;

    add (data) {
        if (typeof data !== 'string') {
            const item = this.manager.createBundle(data);
            if (!this._bundles.has(item.name)) {
                this._bundles.set(item.name, item);
            }
        } else if (!this._bundles.has(data)) {
            const item = this.manager.getBundle(data);
            if (!item) {
                return this.log('error', `Unknown asset name: ${data}`);
            }
            this._bundles.set(data, item);
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
        const anchors = Object.keys(this._positions).join('|');
        const regex = new RegExp(`#asset{(${anchors})}`, 'g');
        return content.replace(regex, this.renderPosition.bind(this));
    }

    renderPosition (match, pos) {
        let result = '';
        for (const bundle of this._resolvedBundles) {
            result += bundle.render(pos);
        }
        return result;
    }

    getBundle (name) {
        return this._bundles.get(name) || this.manager.getBundle(name);
    }

    resolveBundles () {
        this._processedNames = {};
        this._resolvedBundles = [];
        for (const bundle of this._bundles) {
            this.processBundle(bundle);
        }
    }

    processBundle (bundle) {
        if (this._resolvedBundles.includes(bundle)) {
            return;
        }
        if (this._processedNames[bundle.name] === true) {
            return this.logCircularDependency(bundle);
        }
        this._processedNames[bundle.name] = true;
        if (Array.isArray(bundle.depends)) {
            this.processDepends(bundle.depends);
        }
        this._processedNames[bundle.name] = false;
        this._resolvedBundles.push(bundle);
    }

    processDepends (depends) {
        for (const name of depends) {
            const item = this.getBundle(name);
            if (!item) {
                return this.log('error', `Unknown depends name: ${name}`);
            }
            this.processBundle(item);
        }
    }

    logCircularDependency (bundle) {
        let names = this._processedNames;
        names = Object.keys(names).filter(key => names[key] === true);
        this.log('error', `Circular dependency: ${names.join()},${bundle.name}`);
    }

    log () {
        CommonHelper.log(this.manager, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../../helper/CommonHelper');
const DataMap = require('../../base/DataMap');