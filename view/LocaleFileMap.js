/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LocaleFileMap extends Base {

    constructor (config) {
        super({
            // baseDir: base dir
            // localeDir: localization dir,
            required: false, // require files
            ...config
        });
        try {
            this.createBaseMap();
            this.createLocaleMap();
        } catch (err) {}
    }

    createBaseMap () {
        this._base = ClassHelper.spawn(FileMap, {
            dir: path.join(this.baseDir),
            required: this.required
        });
    }

    createLocaleMap () {
        this._locales = {};
        for (const name of fs.readdirSync(this.localeDir)) {
            const dir = path.join(this.localeDir, name);
            if (fs.lstatSync(dir).isDirectory()) {
                const map = ClassHelper.spawn(FileMap, {dir});
                if (!map.isEmpty()) {
                    this._locales[name] = map;
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
        if (Object.prototype.hasOwnProperty.call(this._locales, language)) {
            return this._locales[language].get(name);
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
