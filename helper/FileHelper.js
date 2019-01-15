/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class FileHelper {

    static getRelativePath (file, root) {
        return file.substring(root.length + 1);
    }

    static removeExtension (file) {
        return file.substring(0, file.length - path.extname(file).length);
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
        await PromiseHelper.setImmediate();
        await this.handleChildren(dir, file => this.removeDeep(path.join(dir, file)));
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
        await this.handleChildren(source, file => {
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