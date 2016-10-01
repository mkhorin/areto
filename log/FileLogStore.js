'use strict';

let Base = require('./LogStore');
let async = require('async');
let fs = require('fs');
let mkdirp = require('mkdirp');
let os = require('os');
let path = require('path');

module.exports = class FileLogStore extends Base {

    constructor (config) {
        super(Object.assign({
            baseDir: config.logger.module.getPath(),
            baseName: config.logger.module.ID,
            observePeriod: 60, // seconds
            maxFileSize: 2, // megabytes
            maxFiles: 9,
        }, config));
    }

    init () {
        super.init();        
        this.baseDir = path.join(this.baseDir, 'logs');
        mkdirp.sync(this.baseDir);
        this.maxFileSize *= 1024 * 1024;
        this.file = this.getFile();
        this.fd = fs.openSync(this.file, 'a');
        this.observePeriod && this.observe();
    }

    getFile (index) {
        return path.join(this.baseDir, this.baseName + (index ? `-${index}` : '') +'.log');
    }

    save (type, message, data) {
        fs.write(this.fd, this.format(type, message, data));
    }

    format (type, msg, data) {
        if (msg instanceof Exception) {
            msg = msg.toString();
        } else if (msg instanceof Error) {
            msg = `${msg.message} ${msg.stack}`;
        }
        msg = `${new Date().toISOString()} ${type.toUpperCase()} ${msg}`;
        if (data instanceof Error) {
            msg = `${msg} ${data.stack}`;
        } else if (data instanceof Object) {
            msg = `${msg} ${JSON.stringify(data)}`;
        } else if (data) {
            msg = `${msg} ${data}`;
        }
        return msg + os.EOL;
    }

    getFiles () {
        let dir = this.baseDir;
        let name = this.baseName;
        // sort by update time asc
        return fs.readdirSync(dir).filter(filename => {
            return filename.indexOf(name) === 0 && filename.indexOf('.log') > 0;
        }).map(filename => {
            let file = path.join(dir, filename);
            let time = fs.statSync(file).mtime.getTime();
            return { file, time };
        }).sort((a, b) => a.time - b.time).map(item => item.file);
    }

    observe () {
        setTimeout(()=> {
            fs.fstat(this.fd, (err, stats)=> {
                if (err) {
                    this.logger.module.log('error', 'FileLogStore: observe', err);
                } else if (stats.size > this.maxFileSize) {
                    this.rotate();
                }
                this.observe();
            });
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
        this.logger.module.log('info', `FileLogStore: rotate success: ${this.baseName}`);
    }
};

let Exception = require('../errors/Exception');