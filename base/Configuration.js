/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class Configuration extends Base {

    constructor (dir, name) {
        super();
        this._dir = dir;
        this._names = [];
        this._sources = [];
        this.init(name);
    }

    init (name) {
        if (!this.load(name || process.env.NODE_ENV)) {
            this.load('default');
        }
        this._sources.push({});
        this._data = AssignHelper.deepAssign.apply(AssignHelper, this._sources.reverse());
    }

    load (name) {
        if (this._names.includes(name)) {
            throw new Error(`Configuration already loaded: ${name}`);
        }
        let data = this.readFiles(name);
        if (data) {
            this._sources.push(data);
            this._names.push(name);
            if (data.parent) {
                this.load(data.parent);
            }
            return true;
        }
    }

    get (key, defaults) {
        return ObjectHelper.getNestedValue(key, this._data, defaults);
    }

    getTitle () {
        return this._names.join('.');
    }

    readFiles (name) {
        let base = this.readFile(name);
        if (base) {
            return AssignHelper.deepAssign(base, this.readFile(`${name}-local`));
        }
    }

    readFile (name) {
        let file = path.join(this._dir, `${name}.js`);
        return fs.existsSync(file) ? require(file) : null;
    }
};

const fs = require('fs');
const path = require('path');
const AssignHelper = require('../helper/AssignHelper');
const ObjectHelper = require('../helper/ObjectHelper');