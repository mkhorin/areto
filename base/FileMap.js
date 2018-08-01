'use strict';

const Base = require('../base/Base');

module.exports = class FileMap extends Base {

    constructor (config) {
        super(Object.assign({
            // dir: path
        }, config));
    }

    init () {
        this.indexFiles();
    }

    indexFiles () {
        try {
            this._files = {};
            this.indexDirFiles(this.dir);
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