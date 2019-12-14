/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LocaleFileMap extends Base {

    constructor (config) {
        super({
            localeDirectory: 'locale',
            required: false, // require files
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
        for (const language of fs.readdirSync(localePath)) {
            const directory = path.join(localePath, language, this.directory);
            if (fs.lstatSync(directory).isDirectory()) {
                const fileMap = ClassHelper.spawn(FileMap, {directory});
                if (!fileMap.isEmpty()) {
                    this._locales[language] = fileMap;
                }
            }
        }
    }

    get (name, language) {
        return this._locales[language] && this._locales[language].get(name) || this._default.get(name);
    }

    isEmpty () {
        return this._default.isEmpty() && Object.values(this._locales).length === 0;
    }
};

const fs = require('fs');
const path = require('path');
const ClassHelper = require('../helper/ClassHelper');
const FileMap = require('../base/FileMap');
