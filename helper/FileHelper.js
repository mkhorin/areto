/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class FileHelper {

    static getBasename (file) {
        return path.basename(file, path.extname(file));
    }

    static getRelativePathByDirectory (name, file) {
        const basePath = this.getClosestDirectory(name, file);
        return basePath
            ? this.getRelativePath(basePath, file)
            : file;
    }

    static getRelativePath (basePath, file) {
        return file.indexOf(basePath) === 0
            ? file.substring(basePath.length + 1)
            : file;
    }

    static getExtension (file) {
        return path.extname(file).substring(1);
    }

    static addExtension (ext, file) {
        const old = file.substring(file.lastIndexOf('.') + 1);
        return old !== ext ? `${file}.${ext}` : file;
    }

    static trimExtension (file) {
        const ext = path.extname(file);
        return file.substring(0, file.length - ext.length);
    }

    static getStat (file) {
        return new Promise(resolve => {
            return fs.stat(file, (err, stat) => {
                return resolve(err ? null : stat);
            })
        });
    }

    static async delete (file) {
        const stat = await this.getStat(file);
        if (!stat) {
            return false; // skip non-existent
        }
        if (stat.isFile()) {
            return fs.promises.unlink(file);
        }
        await PromiseHelper.setImmediate(); // flush calling stack
        await this.handleChildren(file, child => {
            return this.delete(path.join(file, child));
        });
        return fs.promises.rm(file, {
            recursive: true
        });
    }

    static async copy (source, target, flags) {
        const stat = await fs.promises.stat(source);
        const mode = {mode: stat.mode};
        if (stat.isFile()) {
            await this.createDirectory(path.dirname(target), mode);
            return fs.promises.copyFile(source, target, flags);
        }
        await this.createDirectory(target, mode);
        await PromiseHelper.setImmediate(); // flush calling stack
        await this.handleChildren(source, file => {
            return this.copyFileInternal(file, ...arguments);
        });
    }

    static async copyChildren (source, target, flags) {
        const stat = await fs.promises.stat(source);
        if (stat.isDirectory()) {
            await this.handleChildren(source, file => {
                return this.copyFileInternal(file, ...arguments);
            });
        }
    }

    static copyFileInternal (file, source, target, flags) {
        source = path.join(source, file);
        target = path.join(target, file);
        return this.copy(source, target, flags);
    }

    // DIRECTORY

    static readDirectory (dir) {
        return new Promise(resolve => {
            return fs.readdir(dir, (err, result) => {
                return resolve(err ? [] : result);
            });
        });
    }

    static createDirectory (dir, options) {
        return fs.promises.mkdir(dir, {
            recursive: true,
            ...options
        });
    }

    static emptyDirectory (dir) {
        return this.handleChildren(dir, file => {
            return this.delete(path.join(dir, file));
        });
    }

    static getClosestDirectory (name, dir) {
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
        const data = await fs.promises.readFile(file);
        return JSON.parse(data);
    }

    static filterJsonFiles (files) {
        return files.filter(this.isJsonExtension, this);
    }

    // HANDLER

    static handleDirectories (dir, handler) {
        return this.handleChildren(dir, async file => {
            const stat = await fs.promises.stat(path.join(dir, file));
            if (stat.isDirectory()) {
                await handler(file, dir, stat);
            }
        });
    }

    static handleFiles (dir, handler) {
        return this.handleChildren(dir, async file => {
            const stat = await fs.promises.stat(path.join(dir, file));
            if (stat.isFile()) {
                await handler(file, dir, stat);
            }
        });
    }

    static async handleChildren (dir, handler) {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
            await handler(file, dir);
        }
    }
};

const PromiseHelper = require('./PromiseHelper');
const fs = require('fs');
const path = require('path');