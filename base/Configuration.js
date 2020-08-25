/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Configuration extends Base {

    _names = [];
    _sources = [];

    constructor (config) {
        super({
            // directory: configuration directory,
            // parent: parent configuration,
            // original: original configuration,
            ...config
        });
    }

    get (key, defaults) {
        return NestedHelper.get(key, this._data, defaults);
    }

    getTitle () {
        return this._names.join('.') || (this.original && this.original.getTitle());
    }

    includes (key, value) {
        return NestedHelper.includes(value, key, this._data);
    }

    mergeWithParents (key) {
        return this.parent ? {...this.parent.mergeWithParents(key), ...this.get(key)} : this.get(key);
    }

    deepMergeWithParents (key) {
        return this.parent
            ? ArrayHelper.deepAssign({}, this.parent.deepMergeWithParents(key), this.get(key))
            : this.get(key);
    }

    async load () {
        if (!this.loadByName(this.name)) {
            this.loadByName('default');
        }
        this._sources.push({});
        this._data = AssignHelper.deepAssign(...this._sources.reverse());
        if (this.original) {
            if (!this._names.includes(this.original.name)) {
                this._names.unshift(this.original.name);
            }
            this._data = AssignHelper.deepAssign({}, this.original._data, this._data);
        }
        AssignHelper.deepAssign(this._data, this.data);
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

const fs = require('fs');
const path = require('path');
const AssignHelper = require('../helper/AssignHelper');
const NestedHelper = require('../helper/NestedHelper');