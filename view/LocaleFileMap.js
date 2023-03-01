/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LocaleFileMap extends Base {

    /**
     * @param {Object} config
     * @param {boolean} config.required - Require files
     */
    constructor (config) {
        super({
            localeDirectory: 'locale',
            required: false,
            ...config
        });
        try {
            this.createDefaultMap();
            this.createLocaleMap();
        } catch {}
    }

    createDefaultMap () {
        this._default = ClassHelper.spawn(FileMap, {
            directory: path.join(this.baseDirectory, this.directory),
            required: this.required
        });
    }

    createLocaleMap () {
        this._locales = {};
        const localePath = path.join(this.baseDirectory, this.localeDirectory);
        const languages = fs.readdirSync(localePath);
        for (const language of languages) {
            const directory = path.join(localePath, language, this.directory);
            const stat = fs.lstatSync(directory);
            if (stat.isDirectory()) {
                const fileMap = ClassHelper.spawn(FileMap, {directory});
                if (!fileMap.isEmpty()) {
                    this._locales[language] = fileMap;
                }
            }
        }
    }

    get (name, language) {
        return this._locales[language]?.get(name)
            || this._default.get(name);
    }

    isEmpty () {
        return this._default.isEmpty()
            && Object.values(this._locales).length === 0;
    }
};

const ClassHelper = require('../helper/ClassHelper');
const FileMap = require('../base/FileMap');
const fs = require('fs');
const path = require('path');
