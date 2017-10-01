'use strict';

const Base = require('./Base');

module.exports = class Theme extends Base {

    init () {
        super.init();
        this.indexFiles();
    }

    indexFiles () {
        this._files = {};
        this._languageFiles = {};
        this.indexDirFiles(this.baseDir);
    }

    indexDirFiles (dir) {
        try {
            for (let filename of fs.readdirSync(dir)) {
                let file = path.join(dir, filename);
                if (fs.lstatSync(file).isDirectory()) {
                    this.indexDirFiles(file);
                } else {
                    let index = file.substring(this.baseDir.length + 1); // get relative path
                    let pos = index.lastIndexOf('.');
                    if (pos > 0) { // remove extension
                        index = index.substring(0, pos);
                    } 
                    index = index.split(path.sep).join('/');
                    this._files[index] = file;
                }            
            }
        } catch (err) {}
    }

    get (name, language) {
        return this.getInner(name, language)
            || (this.template.parent && this.template.parent.getTheme(this.name).get(name, language))
            || name; // as absolute path
    }

    getInner (name, language) {
        return this.getOnly(name, language) || (this.parent && this.parent.get(name, language));
    }

    getOnly (name, language) {
        if (Object.prototype.hasOwnProperty.call(this._files, name)) {
            if (!language) {
                return this._files[name];
            }
            if (!Object.prototype.hasOwnProperty.call(this._languageFiles, name)) {
                this._languageFiles[name] = {};
            }
            if (!this._languageFiles[name].hasOwnProperty(language)) {
                let file = `${path.dirname(name)}/${language}/${path.basename(name)}`;
                this._languageFiles[name][language] = this._files[file] || this._files[name];
            }
            return this._languageFiles[name][language];
        }
    }
};

const fs = require('fs');
const path = require('path');