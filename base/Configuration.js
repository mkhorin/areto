/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Configuration extends Base {

    _names = [];
    _sources = [];

    /**
     * @param {Object} config
     * @param {string} config.directory - Configuration directory
     * @param {Object} config.parent - Parent module configuration instance
     * @param {Object} config.original - Original module configuration instance
     */
    constructor (config) {
        super(config);
    }

    get (key, defaults) {
        return NestedHelper.get(key, this._data, defaults);
    }

    getOwn (key, defaults) {
        return NestedHelper.get(key, this._ownData, defaults);
    }

    getTitle () {
        return this._names.join('.') || this.original?.getTitle();
    }

    includes (key, value) {
        return NestedHelper.includes(value, key, this._data);
    }

    includesOwn (key, value) {
        return NestedHelper.includes(value, key, this._ownData);
    }

    mergeWithParents (key) {
        if (!this.parent) {
            return this.get(key);
        }
        return {
            ...this.parent.mergeWithParents(key),
            ...this.get(key)
        };
    }

    deepMergeWithParents (key) {
        if (!this.parent) {
            return this.get(key);
        }
        const data = this.parent.deepMergeWithParents(key);
        return ArrayHelper.deepAssign({}, data, this.get(key));
    }

    async load () {
        if (!this.loadByName(this.name)) {
            this.loadByName('default');
        }
        this._sources.push({});
        this._data = AssignHelper.deepAssign(...this._sources.reverse());
        this._ownData = AssignHelper.deepAssign({}, this._data, this.data);
        if (this.original) {
            this.loadFromOriginal();
        }
        AssignHelper.deepAssign(this._data, this.data);
    }

    loadFromOriginal () {
        if (!this._names.includes(this.original.name)) {
            this._names.unshift(this.original.name);
        }
        this._data = AssignHelper.deepAssign({}, this.original._data, this._data);
    }

    loadByName (name) {
        if (this._names.includes(name)) {
            throw new Error(`Configuration already loaded: ${name}`);
        }
        const data = this.readFiles(name);
        if (data) {
            this._sources.push(data);
            this._names.push(name);
            if (data.parent) { // local parent file
                this.loadByName(data.parent);
            }
            return true;
        }
    }

    readFiles (name) {
        const base = this.readFile(name);
        if (base) {
            return AssignHelper.deepAssign(base, this.readFile(`${name}.local`));
        }
    }

    readFile (name) {
        const file = path.join(this.directory, `${name}.js`);
        return fs.existsSync(file) ? require(file) : null;
    }

    deepAssign (data) {
        AssignHelper.deepAssign(this._data, data);
    }

    inheritUndefined (keys) {
        if (this.parent) {
            for (const key of keys) {
                this.deepAssignUndefinedByKey(key, this.parent.get(key));
            }
        }
    }

    deepAssignUndefinedByKey (key, data) {
        let value = this.get(key);
        if (!(value instanceof Object)) {
            value = {};
            NestedHelper.set(value, key, this._data);
        }
        AssignHelper.deepAssignUndefined(value, data);
    }
};

const AssignHelper = require('../helper/AssignHelper');
const NestedHelper = require('../helper/NestedHelper');
const fs = require('fs');
const path = require('path');