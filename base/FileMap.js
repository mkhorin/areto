/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class FileMap extends Base {

    constructor (config) {
        super(Object.assign({
            // dir: path
            required: false // require files
        }, config));
        
        this.indexFiles();
    }

    indexFiles () {
        try {
            this._files = {};
            this.indexDirFiles(this.dir);
            if (this.required) {
                this.requireFiles();
            }
        } catch (err) {}
    }

    indexDirFiles (dir) {
        for (let name of fs.readdirSync(dir)) {
            let file = path.join(dir, name);
            if (fs.lstatSync(file).isDirectory()) {
                this.indexDirFiles(file);
            } else {
                let name = this.getRelativeName(file);
                this._files[name] = file;
            }
        }
    }

    getRelativeName (file) {
        let relative = file.substring(this.dir.length + 1);
        let parts = relative.split(path.sep);
        let last = parts.pop();
        last = FileHelper.removeExtension(last);
        parts.push(last);
        return parts.join('/'); // normalize separator
    }

    requireFiles () {
        for (let key of Object.keys(this._files)) {
            try {
                this._files[key] = require(this._files[key]);
            } catch (err) {
                console.error(err);
                delete this._files[key];
            }
        }
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this._files, name)) {
            return this._files[name];
        }
    }

    isEmpty () {
        return Object.values(this._files).length === 0;
    }
};

const fs = require('fs');
const path = require('path');
const FileHelper = require('../helper/FileHelper');