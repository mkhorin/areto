'use strict';

module.exports = class FileHelper {

    static removeExtension (file) {
        return file.substring(0, file.length - path.extname(file).length);
    }

    // DIR

    static getNestedDir (file, root) {
        return path.dirname(file).substring(root.length + 1);
    }

    static async handleDirFiles (dir, fileHandler) {
        let files = fs.readdirSync(dir);
        for (let file of files) {
            await fileHandler(file);
        }
    }

    static readDirWithoutError (dir) {
        try {
            return fs.readdirSync(dir);
        } catch (err) {
            return [];
        }
    }

    static emptyDir (dir) {
        return this.handleDirFiles(dir, file => this.removeDeep(path.join(dir, file)));
    }

    static async removeDeep (dir) {
        let stat = null;
        try {
            stat = fs.statSync(dir);
        } catch (err) {
            return; // skip non-existent
        }
        if (stat.isFile()) {
            return fs.unlinkSync(dir);
        }
        await PromiseHelper.setImmediate();
        await this.handleDirFiles(dir, file => this.removeDeep(path.join(dir, file)));
        fs.rmdirSync(dir);
    }

    static async copyDeep (source, target) {
        let stat = fs.statSync(source);
        if (stat.isFile()) {
            mkdirp.sync(path.dirname(target), {
                mode: stat.mode
            });
            return fs.copyFileSync(source, target);
        }
        mkdirp.sync(target, {
            mode: stat.mode
        });
        await PromiseHelper.setImmediate();
        await this.handleDirFiles(source, file => {
            return this.copyDeep(path.join(source, file), path.join(target, file));
        });
    }

    static getClosestDir (file, target) {
        let dir = path.dirname(file);
        if (dir === file) {
            return null;
        }
        try {
            fs.statSync(path.join(dir, target));
            return dir;
        } catch (err) {
        }
        return this.getClosestDir(dir, target);
    }

    // JSON

    static isJsonExt (file) {
        return path.extname(file).toLowerCase() === '.json';
    }

    static readJsonFile (file) {
        return JSON.parse(fs.readFileSync(file));
    }
};

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const PromiseHelper = require('./PromiseHelper');