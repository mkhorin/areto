/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class FileHelper {

    static getRelativePathByDir (name, file) {
        let root = this.getClosestDir(name, file);
        return root ? this.getRelativePath(root, file) : file;
    }

    static getRelativePath (root, file) {
        return file.indexOf(root) === 0 ? file.substring(root.length + 1) : file;
    }

    static getBasename (file) {
        return path.basename(file, path.extname(file));
    }

    static removeExtension (file) {
        return file.substring(0, file.length - path.extname(file).length);
    }

    static removeFile (file) {
        fs.existsSync(file) && fs.unlinkSync(file);
    }

    // DIR

    static handleChildDirs (dir, handler) {
        return this.handleChildren(dir, async file => {
            if (fs.statSync(path.join(dir, file)).isDirectory()) {
                await handler(file, dir);
            }
        });
    }

    static handleChildFiles (dir, handler) {
        return this.handleChildren(dir, async file => {
            if (fs.statSync(path.join(dir, file)).isFile()) {
                await handler(file, dir);
            }
        });
    }

    static async handleChildren (dir, handler) {
        let files = fs.readdirSync(dir);
        for (let file of files) {
            await handler(file, dir);
        }
    }

    static readDirWithoutError (dir) {
        try {
            return fs.readdirSync(dir);
        } catch (err) {
            return [];
        }
    }

    static createDir (dir, options) {
        fs.mkdirSync(dir, {'recursive': true, ...options});
    }

    static emptyDir (dir) {
        return this.handleChildren(dir, file => this.removeDeep(path.join(dir, file)));
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
        await PromiseHelper.setImmediate(); // break calling stack
        await this.handleChildren(dir, file => this.removeDeep(path.join(dir, file)));
        fs.rmdirSync(dir);
    }

    static async copyDeep (source, target) {
        let stat = fs.statSync(source);
        if (stat.isFile()) {
            this.createDir(path.dirname(target), {'mode': stat.mode});
            return fs.copyFileSync(source, target);
        }
        this.createDir(target, {'mode': stat.mode});
        await PromiseHelper.setImmediate(); // break calling stack
        await this.handleChildren(source, file => {
            return this.copyDeep(path.join(source, file), path.join(target, file));
        });
    }

    static getClosestDir (name, dir) {
        let base = path.basename(dir);
        while (base) {
            if (base === name) {
                return dir;
            }
            base = path.dirname(dir);
            if (base === dir) {
                break; // break root repeating
            }
            dir = base;
            base = path.basename(dir);
        }
    }

    // JSON

    static isJsonExtension (file) {
        return path.extname(file).toLowerCase() === '.json';
    }

    static readJsonFile (file) {
        return JSON.parse(fs.readFileSync(file));
    }

    static filterJsonFiles (files) {
        return files.filter(this.isJsonExtension, this);
    }
};

const fs = require('fs');
const path = require('path');
const PromiseHelper = require('./PromiseHelper');