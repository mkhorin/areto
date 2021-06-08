/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class FileMap extends Base {

    constructor (config) {
        super({
            // directory: [path],
            required: false, // require files
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
        for (const name of fs.readdirSync(dir)) {
            const file = path.join(dir, name);
            if (fs.lstatSync(file).isDirectory()) {
                this.indexDirectoryFiles(file);
            } else {
                this._files[this.getKey(file)] = file;
            }
        }
    }

    getKey (file) {
        const relative = file.substring(this.directory.length + 1);
        const parts = relative.split(path.sep);        
        parts.push(FileHelper.trimExtension(parts.pop()));
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