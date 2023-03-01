/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class FileMap extends Base {

    /**
     * @param {Object} config
     * @param {string} config.directory - Directory path
     * @param {boolean} config.required - Require files
     */
    constructor (config) {
        super({
            required: false,
            ...config
        });
        this.indexFiles();
    }

    isEmpty () {
        return Object.values(this._files).length === 0;
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._files, name)) {
            return this._files[name];
        }
    }

    indexFiles () {
        try {
            this._files = {};
            this.indexDirectoryFiles(this.directory);
            if (this.required) {
                this.requireFiles();
            }
        } catch {}
    }

    indexDirectoryFiles (dir) {
        const names = fs.readdirSync(dir);
        for (const name of names) {
            const file = path.join(dir, name);
            const stat = fs.lstatSync(file);
            if (stat.isDirectory()) {
                this.indexDirectoryFiles(file);
            } else {
                const key = this.getKey(file);
                this._files[key] = file;
            }
        }
    }

    getKey (file) {
        const relative = file.substring(this.directory.length + 1);
        const parts = relative.split(path.sep);
        const name = parts.pop();
        parts.push(FileHelper.trimExtension(name));
        return parts.join('/'); // normalize separator
    }

    requireFiles () {
        for (const key of Object.keys(this._files)) {
            try {
                this._files[key] = require(this._files[key]);
            } catch (err) {
                console.error(err);
                delete this._files[key];
            }
        }
    }
};

const FileHelper = require('../helper/FileHelper');
const fs = require('fs');
const path = require('path');