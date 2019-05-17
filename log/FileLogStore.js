/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class FileLogStore extends Base {

    constructor (config) {
        super({
            root: config.logger.module.getPath(),
            dir: 'log',
            name: config.logType ? config.logType.name : 'common',
            observePeriod: 30, // seconds, 0 - off
            maxFileSize: 2, // megabytes
            maxFiles: 1,
            ...config
        });
        this.root = path.join(this.root, this.dir);
        this.file = this.getFile();
        this.fullFile = this.getFile('full');
        this.maxFileSize *= 1024 * 1024; // megabytes to bytes
        fs.mkdirSync(this.root, {recursive: true});
        this.fd = fs.openSync(this.file, 'a');
    }

    init () {
        if (this.observePeriod) {
            this.observe();
        }
    }

    getFile (suffix) {
        return path.join(this.root, this.name + (suffix ? `-${suffix}` : '') +'.log');
    }

    save (type, message, data) {
        fs.write(this.fd, this.format(type, message, data), err => {
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
            let stat = await PromiseHelper.promise(fs.fstat.bind(fs, this.fd));
            if (stat.size > this.maxFileSize) {
                await this.rotate();
            }
        } catch (err) {
            this.log('error', this.wrapClassMessage('checkout'), err);
        }
    }

    async rotate () {
        await fs.promises.rename(this.file, this.fullFile);
        fs.closeSync(this.fd);
        this.fd = fs.openSync(this.file, 'a');
        let files = await this.getFiles();
        await this.removeExcessFiles(files);
        for (let i = files.length - 1; i >= 0; --i) {
            await fs.promises.rename(files[i], this.getFile(i + 1));
        }
        this.log('info', `Rotate success: ${this.name}`);
    }

    async removeExcessFiles (files) {
        if (files.length > this.maxFiles) {
            let unlinks = files.splice(this.maxFiles, files.length);
            for (let file of unlinks) {
                await fs.promises.unlink(file);
            }
        }
    }

    async getFiles () {
        let baseName = path.basename(this.file);
        let items = [];
        for (let file of await fs.promises.readdir(this.root)) {
            if (file.indexOf(this.name) === 0 && file !== baseName) {
                file = path.join(this.root, file);
                let stat = await fs.promises.stat(file);
                let time = stat.mtime.getTime();
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