/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class FileLogStore extends Base {

    constructor (config) {
        super({
            basePath: 'log',
            observePeriod: 30, // seconds, 0 - off
            maxFileSize: 2, // megabytes
            maxFiles: 1,
            ...config
        });
        this.basePath = this.module.resolvePath(this.basePath);
        this.file = this.getFile();
        this.fullFile = this.getFile('full');
        this.maxFileSize *= 1024 * 1024; // megabytes to bytes
    }

    init () {
        fs.mkdirSync(this.basePath, {recursive: true});
        this.openFile();
        if (this.observePeriod) {
            this.observe();
        }
    }

    getFile (suffix) {
        return path.join(this.basePath, this.name + (suffix ? `-${suffix}` : '') +'.log');
    }

    openFile () {
        this._fd = fs.openSync(this.file, 'a');
    }

    save () {
        fs.write(this._fd, this.format(...arguments), err => {
            if (err) {
                console.error(this.wrapClassMessage(`save`), err);
            }
        });
    }

    format (type, msg, data) {
        if (msg instanceof Exception) {
            msg = msg.toString();
        } else if (msg instanceof Error) {
            msg = `${msg.message} ${msg.stack}`;
        }
        msg = `${new Date().toISOString()} ${type.toUpperCase()} ${msg}`;
        if (data) {
            msg = `${msg} ${data}`;
        }
        return msg + os.EOL;
    }

    observe () {
        setTimeout(async ()=> {
            await this.checkout();
            this.observe();
        }, this.observePeriod * 1000);
    }

    async checkout () {
        try {
            const {size} = await PromiseHelper.promise(fs.fstat.bind(fs, this._fd));
            if (size > this.maxFileSize) {
                await this.rotate();
            }
        } catch (err) {
            this.log('error', this.wrapClassMessage('checkout'), err);
        }
    }

    async rotate () {
        await fs.promises.rename(this.file, this.fullFile);
        fs.closeSync(this._fd);
        this.openFile();
        const files = await this.getFiles();
        await this.removeExcessFiles(files);
        for (let i = files.length - 1; i >= 0; --i) {
            await fs.promises.rename(files[i], this.getFile(i + 1));
        }
        this.log('info', `Rotate success: ${this.name}`);
    }

    async removeExcessFiles (files) {
        if (files.length > this.maxFiles) {
            const unlinks = files.splice(this.maxFiles, files.length);
            for (let file of unlinks) {
                await fs.promises.unlink(file);
            }
        }
    }

    async getFiles () {
        const baseName = path.basename(this.file);
        const items = [];
        for (let file of await fs.promises.readdir(this.basePath)) {
            if (file.indexOf(this.name) === 0 && file !== baseName) {
                file = path.join(this.basePath, file);
                const stat = await fs.promises.stat(file);
                const time = stat.mtime.getTime();
                if (stat.isFile()) {
                    items.push({file, time});
                }
            }
        }
        return items.sort((a, b)=> b.time - a.time).map(item => item.file);
    }
};

const fs = require('fs');
const os = require('os');
const path = require('path');
const Exception = require('../error/Exception');
const PromiseHelper = require('../helper/PromiseHelper');