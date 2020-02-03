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
        return basePath ? this.getRelativePath(basePath, file) : file;
    }

    static getRelativePath (basePath, file) {
        return file.indexOf(basePath) === 0 ? file.substring(basePath.length + 1) : file;
    }

    static trimExtension (file) {
        return file.substring(0, file.length - path.extname(file).length);
    }

    static getStat (file) {
        return new Promise(resolve => fs.stat(file, (err, stat) => resolve(err ? null : stat)));
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
        await this.handleChildren(file, child => this.delete(path.join(file, child)));
        return fs.promises.rmdir(file);
    }

    static async copy (source, target, flags) {
        const stat = await fs.promises.stat(source);
        if (stat.isFile()) {
            await this.createDirectory(path.dirname(target), {mode: stat.mode});
            return fs.promises.copyFile(source, target, flags);
        }
        await this.createDirectory(target, {mode: stat.mode});
        await PromiseHelper.setImmediate(); // flush calling stack
        await this.handleChildren(source, file => {
            return this.copy(path.join(source, file), path.join(target, file), flags);
        });
    }

    static async copyChildren (source, target, flags) {
        const stat = await fs.promises.stat(source);
        if (stat.isDirectory()) {
            await this.handleChildren(source, file => {
                return this.copy(path.join(source, file), path.join(target, file), flags);
            });
        }
    }

    // DIRECTORY

    static readDirectory (dir) {
        return new Promise(resolve => fs.readdir(dir, (err, result) => resolve(err ? [] : result)));
    }

    static createDirectory (dir, options) {
        return fs.promises.mkdir(dir, {
            recursive: true,
            ...options
        });
    }

    static emptyDirectory (dir) {
        return this.handleChildren(dir, file => this.delete(path.join(dir, file)));
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
        return JSON.parse(await fs.promises.readFile(file));
    }

    static filterJsonFiles (files) {
        return files.filter(this.isJsonExtension, this);
    }

    // HANDLER

    static handleChildDirectories (dir, handler) {
        return this.handleChildren(dir, async file => {
            const stat = await fs.promises.stat(path.join(dir, file));
            if (stat.isDirectory()) {
                await handler(file, dir, stat);
            }
        });
    }

    static handleChildFiles (dir, handler) {
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

const fs = require('fs');
const path = require('path');
const PromiseHelper = require('./PromiseHelper');