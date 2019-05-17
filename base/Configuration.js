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
            // dir: config dir,
            // parent: parent config,
            // origin: origin config,
            ...config
        });
        this.name = this.name || process.env.NODE_ENV;
    }

    get (key, defaults) {
        return ObjectHelper.getNestedValue(key, this._data, defaults);
    }

    getTitle () {
        return this._names.join('.') || this.origin && this.origin.getTitle();
    }

    includes (key, value) {
        return ObjectHelper.includesNestedValue(value, key, this._data);
    }

    async load () {
        if (!this.loadByName(this.name)) {
            this.loadByName('default');
        }
        this._sources.push({});
        this._data = AssignHelper.deepAssign(...this._sources.reverse());
        if (this.origin) {
            this._data = AssignHelper.deepAssign({}, this.origin._data, this._data);
        }
    }

    loadByName (name) {
        if (this._names.includes(name)) {
            throw new Error(`Configuration already loaded: ${name}`);
        }
        let data = this.readFiles(name);
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
        let base = this.readFile(name);
        if (base) {
            return AssignHelper.deepAssign(base, this.readFile(`${name}.local`));
        }
    }

    readFile (name) {
        let file = path.join(this.dir, `${name}.js`);
        return fs.existsSync(file) ? require(file) : null;
    }

    deepAssign (data) {
        AssignHelper.deepAssign(this._data, data);
    }

    inheritUndefined (keys) {
        if (this.parent) {
            for (let key of keys) {
                this.deepAssignUndefinedByKey(key, this.parent.get(key));
            }
        }
    }

    deepAssignUndefinedByKey (key, data) {
        let value = this.get(key);
        if (!(value instanceof Object)) {
            value = {};
            ObjectHelper.setNestedValue(value, key, this._data);
        }
        AssignHelper.deepAssignUndefined(value, data);
    }
};

const fs = require('fs');
const path = require('path');
const AssignHelper = require('../helper/AssignHelper');
const ObjectHelper = require('../helper/ObjectHelper');