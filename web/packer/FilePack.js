/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class FilePack extends Base {

    /**
     * @param {Object} config
     * @param {string} config.target - File name relative to module
     */
    constructor (config) {
        super({
            includes: [],
            excludes: [],
            fromModule: true,
            fromOriginal: true,
            ...config
        });
        if (this.Minifier) {
            this.minifier = this.spawn(this.Minifier);
        }
    }

    async pack () {
        this._data = '';
        this._done = {};
        for (const name of this.includes) {
            await this.packByName(name);
        }
        return this.saveTarget();
    }

    async packByName (name) {
        let file, stat;
        if (this.fromModule) {
            file = this.module.getPath(name);
            stat = await FileHelper.getStat(file);
        }
        if (!stat && this.fromOriginal) {
            let module = this.module.original;
            while (module && !stat) {
                file = module.getPath(name);
                stat = await FileHelper.getStat(file);
                module = module.original;
            }
        }
        if (!stat) {
            return this.log('error', `File not found: ${name}`);
        }
        return stat.isDirectory()
            ? this.packDirectory(file, name)
            : this.packFile(file, name);
    }

    async packDirectory (dir, baseName) {
        for (let name of await FileHelper.readDirectory(dir)) {
            const file = dir + '/' + name;
            const stat = await FileHelper.getStat(file);
            name = baseName + '/' + name;
            stat.isDirectory()
                ? await this.packDirectory(file, name)
                : await this.packFile(file, name);
        }
    }

    async packFile (file, name) {
        if (this._done[name] !== true && this.filter(name)) {
            const data = await fs.promises.readFile(file);
            this._data += this.processFileData(data);
            this._done[name] = true;
            this.log('trace', `File packed: ${name}: ${file}`);
        }
    }

    filter (name) {
        for (const data of this.excludes) {
            if (data instanceof RegExp) {
                if (data.test(name)) {
                    return false;
                }
            } else if (typeof data === 'string') {
                if (name === data) {
                    return false;
                }
            } else if (typeof data === 'function') {
                if (data(name)) {
                    return false;
                }
            }
        }
        return true;
    }

    processFileData (data) {
        return this.minifier ? this.minifier.execute(data.toString()) : data;
    }

    async saveTarget () {
        if (this.target) {
            const file = this.module.getPath(this.target);
            await fs.promises.mkdir(path.dirname(file), {recursive: true});
            await fs.promises.writeFile(file, this._data);
            this.log('info', `Target ready: ${this.target}`);
        }
    }

    log () {
        CommonHelper.log(this.packer, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../../helper/CommonHelper');
const FileHelper = require('../../helper/FileHelper');
const fs = require('fs');
const path = require('path');