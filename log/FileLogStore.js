/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const MEGABYTE_SIZE = 1024 * 1024;
const Base = require('./LogStore');

module.exports = class FileLogStore extends Base {

    constructor (config) {
        super({
            'baseDir': config.logger.module.getPath(),
            'dir': 'log',
            'fileName': config.logType ? config.logType.name : 'common',
            'observePeriod': 60, // seconds, 0 - off
            'maxFileSize': 2, // megabytes
            'maxFiles': 1,
            ...config
        });
        this.baseDir = path.join(this.baseDir, this.dir);
        this.file = this.getFile();
        this.maxFileSize *= MEGABYTE_SIZE;
        mkdirp.sync(this.baseDir);
        this.fd = fs.openSync(this.file, 'a');
        if (this.observePeriod) {
            this.observe();
        }
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
        setTimeout(()=> {
            try {
                let stat = fs.fstatSync(this.fd);
                if (stat.size > this.maxFileSize) {
                    this.rotate();
                }
                this.observe();
            } catch (err) {
                this.log('error', this.wrapClassMessage('observe'), err);
            }
        }, this.observePeriod * 1000);
    }

    rotate () {
        fs.closeSync(this.fd);
        let files = this.getFiles();
        if (files.length > this.maxFiles) {
            let unlinks = files.splice(0, files.length - this.maxFiles);
            for (let item of unlinks) {
                fs.unlinkSync(item);
            }
        }
        for (let i = 0; i < files.length; ++i) {
            fs.renameSync(files[i], this.getFile(files.length - i));
        }
        this.fd = fs.openSync(this.file, 'a');
        this.log('info', `Rotate success: ${this.fileName}`);
    }

    getFile (index) {
        return path.join(this.baseDir, this.fileName + (index ? `-${index}` : '') +'.log');
    }

    getFiles () {
        let dir = this.baseDir;
        let name = this.fileName;
        // sort by update time asc
        return fs.readdirSync(dir).filter(filename => {
            return filename.indexOf(name) === 0 && filename.indexOf('.log') > 0;
        }).map(filename => {
            let file = path.join(dir, filename);
            let time = fs.statSync(file).mtime.getTime();
            return {file, time};
        }).sort((a, b) => a.time - b.time).map(item => item.file);
    }
};

const fs = require('fs');
const mkdirp = require('mkdirp');
const os = require('os');
const path = require('path');
const Exception = require('../error/Exception');