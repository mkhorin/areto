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
        if (this.parent) {
            return this.parent.get(name);
        }    
        if (this.manager.parent) {
            return this.manager.parent.getTheme(this.name).get(name);
        }
        this.manager.module.log('error', `${this.constructor.name}: Not found template: ${name}`);
        return '';
    }
};

const fs = require('fs');
const path = require('path');