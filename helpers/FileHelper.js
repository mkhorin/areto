'use strict';

module.exports = class FileHelper {

    // DIR

    static getNestedDir (file, root) {
        return path.dirname(file).substring(root.length + 1);
    }

    static readDir (dir, handler, cb) {
        AsyncHelper.waterfall([
            cb => fs.readdir(dir, cb),
            (files, cb)=> AsyncHelper.eachSeries(files, handler, cb)
        ], cb);
    }

    static emptyDir (dir, cb) {
        this.readDir(dir, (file, cb)=> {
            this.removeDeep(path.join(dir, file), cb);
        }, cb);
    }

    static removeDeep (file, cb) {
        AsyncHelper.waterfall([
            cb => fs.stat(file, (err, stat)=> cb(null, stat)), // skip if not exists
            (stat, cb)=> {
                if (!stat) {
                    return cb();
                }
                if (stat.isFile()) {
                    return fs.unlink(file, cb);
                }
                AsyncHelper.series([
                    cb => this.readDir(file, (name, cb)=> {
                        this.removeDeep(path.join(file, name), cb);
                    }, cb),
                    cb => fs.rmdir(file, cb)
                ], cb);
            }
        ], cb);
    }

    static copyDeep (source, target, cb) {
        AsyncHelper.waterfall([
            cb => fs.stat(source, cb),
            (stat, cb)=> {
                if (stat.isFile()) {
                    return AsyncHelper.series([
                        cb => mkdirp(path.dirname(target), {mode: stat.mode}, cb),
                        cb => fs.copyFile(source, target, cb)
                    ], cb);
                }
                AsyncHelper.series([
                    cb => mkdirp(target, {mode: stat.mode}, cb),
                    cb => this.readDir(source, (name, cb)=> {
                        this.copyDeep(path.join(source, name), path.join(target, name), cb);
                    }, cb)
                ], cb);
            }
        ], cb);
    }

    static getClosestDirByTarget (file, target) {
        let dir = path.dirname(file);
        if (dir === file) {
            return null;
        }
        try {
            fs.statSync(path.join(dir, target));
            return dir;
        } catch (err) {
        }
        return this.getClosestDirByTarget(dir, target);
    }

    // JSON

    static isJsonExt (file) {
        return path.extname(file).toLowerCase() === '.json';
    }

    static readJsonFile (file, cb) {
        AsyncHelper.waterfall([
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

const fs = require('fs');
const mkdirp = require('mkdirp');
const path = require('path');
const AsyncHelper = require('./AsyncHelper');