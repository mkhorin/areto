/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class AssetManager extends Base {

    constructor (config) {
        super({
            'bundles': [],
            'parentName': 'asset', // asset component from parent module
            'ViewAsset': require('./ViewAsset'),
            'AssetBundle': require('./AssetBundle'),
            ...config
        });
    }

    init () {
        this.parent = this.module.getParentComponent(this.parentName);
        this.createBundles();
    }

    createViewAsset () {
        return ClassHelper.createInstance(this.ViewAsset, {
            'manager': this
        });
    }

    hasBundle (name) {
        return Object.prototype.hasOwnProperty.call(this._bundleMap, name);
    }

    getBundle (name) {
        return this.hasBundle(name) ? this._bundleMap[name] : null;
    }

    createBundles () {
        this._bundleMap = this.parent ? {...this.parent._bundleMap} : {};
        for (let data of this.bundles) {
            this._bundleMap[data.name] = this.createBundle(data);
        }
    }

    createBundle (data) {
        data.manager = this;
        return ClassHelper.createInstance(data.Class || this.AssetBundle, data);
    }
};

const ClassHelper = require('../../helper/ClassHelper');