'use strict';

const Base = require('./Base');
const fs = require('fs');
const path = require('path');

module.exports = class Theme extends Base {

    init () {        
        this.indexFiles();
    }

    indexFiles () {
        this.files = {};
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
                    this.files[index] = file;
                }            
            }
        } catch (err) {}
    }

    get (name) {
        if (Object.prototype.hasOwnProperty.call(this.files, name)) {
            return this.files[name];
        }    
        if (this.parent) {
            return this.parent.get(name);
        }    
        if (this.manager.parent) {
            return this.manager.parent.getTheme(this.name).get(name);
        }
        return `Theme: Not found: ${name}`;
    }
};