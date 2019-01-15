/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Configuration extends Base {

    constructor (config) {
        super({
            // dir
            // name
            ...config
        });
        this.name = this.name || process.env.NODE_ENV;
        this._names = [];
        this._sources = [];
    }

    get (key, defaults) {
        return ObjectHelper.getNestedValue(key, this._data, defaults);
    }

    getTitle () {
        return this._names.join('.');
    }

    includesIfArray (key, value) {
        let items = ObjectHelper.getNestedValue(key, this._data);
        return !(items instanceof Array) || items.includes(value);
    }

    load () {
        if (!this.loadByName(this.name)) {
            this.loadByName('default');
        }
        this._sources.push({});
        this._data = AssignHelper.deepAssign.apply(AssignHelper, this._sources.reverse());
    }

    loadByName (name) {
        if (this._names.includes(name)) {
            throw new Error(`Configuration already loaded: ${name}`);
        }
        let data = this.readFiles(name);
        if (data) {
            this._sources.push(data);
            this._names.push(name);
            if (data.parent) {
                this.loadByName(data.parent);
            }
            return true;
        }
    }

    readFiles (name) {
        let base = this.readFile(name);
        if (base) {
            return AssignHelper.deepAssign(base, this.readFile(`${name}-local`));
        }
    }

    readFile (name) {
        let file = path.join(this.dir, `${name}.js`);
        return fs.existsSync(file) ? require(file) : null;
    }

    deepAssign (data) {
        AssignHelper.deepAssign(this._data, data);
    }
};

const fs = require('fs');
const path = require('path');
const AssignHelper = require('../helper/AssignHelper');
const ObjectHelper = require('../helper/ObjectHelper');