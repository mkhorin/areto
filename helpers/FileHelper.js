'use strict';

const async = require('async');
const fs = require('fs');
const path = require('path');

module.exports = class FileHelper {

    // DIR 
    
    static readDir (dir, handler, cb) {
        async.waterfall([
            cb => fs.readdir(dir, cb),
            (files, cb)=> async.eachSeries(files, handler, cb)
        ], cb);
    }

    static emptyDir (dir, cb) {
        this.readDir(dir, (file, cb)=> {
            file = path.join(dir, file);
            async.waterfall([
                cb => fs.stat(file, cb),
                (stat, cb)=> stat.isDirectory() ? this.removeDir(file, cb) : fs.unlink(file, cb)
            ], cb);
        }, cb);
    }

    static removeDir (dir, cb) {
        async.series([
            cb => this.readDir(dir, (file, cb)=> {
                file = path.join(dir, file);
                async.waterfall([
                    cb => fs.stat(file, cb),
                    (stat, cb)=> stat.isDirectory() ? this.removeDir(file, cb) : fs.unlink(file, cb)
                ], cb);
            }, cb),
            cb => fs.rmdir(dir, cb)
        ], cb);
    }
    
    // JSON

    static isJsonExt (file) {
        return path.extname(file).toLowerCase() === '.json';
    }

    static readJsonFile (file, cb) {
        async.waterfall([
            cb => fs.readFile(file, cb),
            (data, cb)=> {
                try {
                    data = JSON.parse(data);
                } catch (err) {
                    return cb(err);
                }
                cb(null, data);
            }
        ], cb);
    }
};