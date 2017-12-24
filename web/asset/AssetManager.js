'use strict';

const Base = require('../../base/Component');

module.exports = class AssetManager extends Base {

    constructor (config) {
        super(Object.assign({
            bundles: [],
            parentName: 'asset', // asset component from parent module
            ViewAsset,
            AssetBundle
        }, config));
    }

    init () {
        super.init();
        this.parent = this.module.getComponentFromParent(this.parentName);
        this.createBundles();
    }

    createViewAsset () {
        return new this.ViewAsset({
            manager: this
        });
    }

    hasBundle (name) {
        return Object.prototype.hasOwnProperty.call(this._bundles, name);
    }

    getBundle (name) {
        return this.hasBundle(name) ? this._bundles[name] : null;
    }

    createBundles () {
        this._bundles = this.parent ? Object.assign({}, this.parent._bundles) : {};
        for (let data of this.bundles) {
            this._bundles[data.name] = this.createBundle(data);
        }
    }

    createBundle (data) {
        data.manager = this;
        return new (data.Class || this.AssetBundle)(data);
    }
};

const async = require('async');
const ClassHelper = require('../../helpers/ClassHelper');
const ViewAsset = require('./ViewAsset');
const AssetBundle = require('./AssetBundle');