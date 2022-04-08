/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class FileLogStore extends Base {

    static parseFilename (name) {
        if (typeof name !== 'string') {
            return null;
        }
        name = FileHelper.getBasename(name);
        const index = name.lastIndexOf('-');
        return index !== -1
            ? [name.substring(0, index), name.substring(index + 1)]
            : [name];
    }

    /**
     * @param {Object} config
     * @param {number} config.observePeriod - In seconds (null to off)
     * @param {number} config.maxFileSize - In megabytes
     */
    constructor (config) {
        super({
            basePath: 'log',
            observePeriod: 30,
            maxFileSize: 2,
            maxFiles: 1,
            ...config
        });
        this.basePath = this.module.resolvePath(this.basePath);
        this.file = this.getFile();
        this.fullFile = this.getFile('full');
        this.maxFileSize *= 1024 * 1024; // megabytes to bytes
        this.outputBuffer = '';
        this.onWrite = this.onWrite.bind(this);
        fs.mkdirSync(this.basePath, {recursive: true});
        this.openFile();
    }

    init () {
        if (this.observePeriod) {
            this.observe();
        }
    }

    getFile (suffix) {
        return path.join(this.basePath, this.name + (suffix ? `-${suffix}` : '') + '.log');
    }

    openFile () {
        this.fileDescriptor = fs.openSync(this.file, 'a');
        this.readyWrite = true;
    }

    save () {
        this.outputBuffer += this.format(...arguments);
        if (this.readyWrite) {
            this.write();
        }
    }

    write () {
        this.readyWrite = false;
        const content = this.outputBuffer;
        this.outputBuffer = '';
        fs.write(this.fileDescriptor, content, this.onWrite);
    }

    onWrite (err) {
        if (err) {
            return console.error(this.wrapClassMessage(`save`), err);
        }
        if (this.outputBuffer) {
            return this.write();
        }
        this.readyWrite = true;
    }

    format (type, text, data) {
        if (text instanceof Exception) {
            text = text.toString();
        } else if (text instanceof Error) {
            text = `${text.message} ${text.stack}`;
        }
        text = `${new Date().toISOString()} ${type.toUpperCase()} ${text}`;
        if (data) {
            text = `${text} ${data}`;
        }
        return text + os.EOL;
    }

    observe () {
        setTimeout(async () => {
            await this.checkout();
            this.observe();
        }, this.observePeriod * 1000);
    }

    async checkout () {
        try {
            const {size} = await PromiseHelper.promise(fs.fstat, fs, this.fileDescriptor);
            if (size > this.maxFileSize) {
                await this.rotate();
            }
        } catch (err) {
            this.log('error', this.wrapClassMessage('checkout'), err);
        }
    }

    async rotate () {
        await fs.promises.rename(this.file, this.fullFile);
        fs.closeSync(this.fileDescriptor);
        this.openFile();
        const files = await this.getSortedFiles();
        await this.deleteExcessFiles(files);
        for (let i = files.length - 1; i >= 0; --i) {
            await fs.promises.rename(files[i], this.getFile(i + 1));
        }
        this.log('info', `Rotation done: ${this.name}`);
    }

    async deleteExcessFiles (files) {
        if (files.length > this.maxFiles) {
            const unlinks = files.splice(this.maxFiles, files.length);
            for (const file of unlinks) {
                await fs.promises.unlink(file);
            }
        }
    }

    async getSortedFiles () {
        const baseName = path.basename(this.file);
        const items = [];
        for (let name of await fs.promises.readdir(this.basePath)) {
            if (name.indexOf(this.name) === 0 && name !== baseName) {
                const file = path.join(this.basePath, name);
                const stat = await fs.promises.stat(file);
                const time = stat.mtime.getTime();
                if (stat.isFile()) {
                    items.push({file, time});
                }
            }
        }
        return items
            .sort((a, b) => b.time - a.time)
            .map(item => item.file);
    }

    async getFiles () {
        const items = [];
        for (let name of await fs.promises.readdir(this.basePath)) {
            if (name.indexOf(this.name) === 0) {
                const file = path.join(this.basePath, name);
                const stat = await fs.promises.stat(file);
                if (stat.isFile()) {
                    items.push({name, file, stat});
                }
            }
        }
        return items;
    }
};

const Exception = require('../error/Exception');
const FileHelper = require('../helper/FileHelper');
const PromiseHelper = require('../helper/PromiseHelper');
const fs = require('fs');
const os = require('os');
const path = require('path');