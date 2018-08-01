'use strict';

const Base = require('../base/Base');

module.exports = class LocalFileMap extends Base {

    constructor (config) {
        super(Object.assign({
            // baseDir: base path
            // localDir: localization path
        }, config));
    }

    init () {
        try {
            this.createBaseMap();
            this.createLocalMap();
        } catch (err) {}
    }

    createBaseMap () {
        this._base = ClassHelper.createInstance(FileMap, {
            dir: path.join(this.baseDir)
        });
    }

    createLocalMap () {
        this._locals = {};
        for (let name of fs.readdirSync(this.localDir)) {
            let dir = path.join(this.localDir, name);
            if (fs.lstatSync(dir).isDirectory()) {
                let map = ClassHelper.createInstance(FileMap, {dir});
                if (!map.isEmpty()) {
                    this._locals[name] = map;
                }
            }
        }
    }

    get (name, language) {
        return language && this.getLocal(name, language) || this._base.get(name);
    }

    getBase (name) {
        return this._base.get(name);
    }

    getLocal (name, language) {
        if (Object.prototype.hasOwnProperty.call(this._locals, language)) {
            return this._locals[language].get(name);
        }
    }

    isEmpty () {
        return this._base.isEmpty();
    }
};

const fs = require('fs');
const path = require('path');
const ClassHelper = require('../helper/ClassHelper');
const FileMap = require('../base/FileMap');
