'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');

module.exports = class FileHelper {

    static readDir (dir, handler, cb) {
        fs.readdir(dir, (err, files)=> {
            err ? cb(err) : async.eachSeries(files, handler, cb);
        });
    }

    static emptyDir (dir, cb) {
        this.readDir(dir, (file, cb)=> {
            file = path.join(dir, file);
            fs.stat(file, (err, stat)=> {
                err ? cb(err)
                    : stat.isDirectory() ? this.removeDir(file, cb) : fs.unlink(file, cb);
            });
        }, cb);
    }

    static removeDir (dir, cb) {
        this.readDir(dir, (file, cb)=> {
            file = path.join(dir, file);
            fs.stat(file, (err, stat)=> {
                err ? cb(err)
                    : stat.isDirectory() ? this.removeDir(file, cb) : fs.unlink(file, cb);
            });
        }, err => {
            err ? cb(err) : fs.rmdir(dir, cb);
        });
    }
};