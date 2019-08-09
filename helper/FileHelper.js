/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class FileHelper {

    static getBasename (file) {
        return path.basename(file, path.extname(file));
    }

    static getRelativePathByDir (name, file) {
        const basePath = this.getClosestDir(name, file);
        return basePath ? this.getRelativePath(basePath, file) : file;
    }

    static getRelativePath (basePath, file) {
        return file.indexOf(basePath) === 0 ? file.substring(basePath.length + 1) : file;
    }

    static removeExtension (file) {
        return file.substring(0, file.length - path.extname(file).length);
    }

    static getStat (file) {
        return new Promise(resolve => fs.stat(file, (err, stat)=> resolve(err ? null : stat)));
    }

    static async remove (dir) {
        const stat = await this.getStat(dir);
        if (!stat) {
            return false; // skip non-existent
        }
        if (stat.isFile()) {
            return fs.promises.unlink(dir);
        }
        await PromiseHelper.setImmediate(); // break calling stack
        await this.handleChildren(dir, file => this.remove(path.join(dir, file)));
        return fs.promises.rmdir(dir);
    }

    static async copy (source, target) {
        const stat = await fs.promises.stat(source);
        if (stat.isFile()) {
            await this.createDir(path.dirname(target), {mode: stat.mode});
            return fs.promises.copyFile(source, target);
        }
        await this.createDir(target, {mode: stat.mode});
        await PromiseHelper.setImmediate(); // break calling stack
        await this.handleChildren(source, file => {
            return this.copy(path.join(source, file), path.join(target, file));
        });
    }

    // DIR

    static readDir (dir) {
        return new Promise(resolve => fs.readdir(dir, (err, result)=> resolve(err ? [] : result)));
    }

    static createDir (dir, options) {
        return fs.promises.mkdir(dir, {recursive: true, ...options});
    }

    static emptyDir (dir) {
        return this.handleChildren(dir, file => this.remove(path.join(dir, file)));
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

    static async readJsonFile (file) {
        return JSON.parse(await fs.promises.readFile(file));
    }

    static filterJsonFiles (files) {
        return files.filter(this.isJsonExtension, this);
    }

    // HANDLER

    static handleChildDirs (dir, handler) {
        return this.handleChildren(dir, async file => {
            let stat = await fs.promises.stat(path.join(dir, file));
            if (stat.isDirectory()) {
                await handler(file, dir);
            }
        });
    }

    static handleChildFiles (dir, handler) {
        return this.handleChildren(dir, async file => {
            let stat = await fs.promises.stat(path.join(dir, file));
            if (stat.isFile()) {
                await handler(file, dir);
            }
        });
    }

    static async handleChildren (dir, handler) {
        const files = await fs.promises.readdir(dir);
        for (let file of files) {
            await handler(file, dir);
        }
    }
};

const fs = require('fs');
const path = require('path');
const PromiseHelper = require('./PromiseHelper');