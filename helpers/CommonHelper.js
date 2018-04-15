'use strict';

module.exports = class CommonHelper {

    static isEmpty (value) {
        return value === undefined || value === null || value === '';
    }

    static isEqual (id1, id2) {
        return id1 instanceof MongoId
            ? id1.equals(id2)
            : id2 instanceof MongoId ? id2.equals(id1) : id1 === id2;
    }

    static getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static parseJson (data) {
        try {
            return JSON.parse(data);
        } catch (err) {}
    }

    static parseArguments (args, optionPrefix = '--') {
        let result = {}, key;
        for (let item of (Array.isArray(args) ? args : [])) {
            if (typeof item === 'string' && item.indexOf(optionPrefix) === 0) {
                key = item.substring(optionPrefix.length);
            } else if (key !== undefined) {
                if (result[key] instanceof Array) {
                    result[key].push(item);
                } else if (result[key] !== undefined) {
                    result[key] = [result[key], item];
                } else {
                    result[key] = item;
                }
            }
        }
        return result;
    }

    static parseRelationChanges (data) {
        if (data && typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch (err) {
                return false;
            }
        }
        if (!data) {
            return null;
        }
        if (!Array.isArray(data.links)) {
            data.links = [];
        }
        if (!Array.isArray(data.unlinks)) {
            data.unlinks = [];
        }
        if (!Array.isArray(data.removes)) {
            data.removes = [];
        }
        let all = data.links.concat(data.unlinks, data.removes);
        return all.length === ArrayHelper.unique(all).length ? data : false;
    }
    
    // DATE

    static isValidDate (date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        // stackoverflow.com/questions/1353684/detecting-an-invalid-date-date-instance-in-javascript
        return Object.prototype.toString.call(date) !== '[object Date]' ? false : !isNaN(date.getTime());
    }

    static getValidDate (date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return Object.prototype.toString.call(date) !== '[object Date]' ? null : isNaN(date.getTime()) ? null : date;
    }

    // ESCAPE

    static escapeRegExp (text) {
        return String(text).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    static escapeHtml (html) {
        return String(html).replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    // PROCESS

    static isWinPlatform () {
        return /^win/.test(process.platform);
    }

    static spawnProcess (path, command, args, cb) {
        try {
            if (this.isWinPlatform()) {
                command += '.cmd';
            }
            let child = childProcess.spawn(command, args, {
                cwd: path,
                env: process.env
            });
            child.stdout.on('data', data => console.log(`${data}`));
            child.stderr.on('data', data => console.error(`${data}`));
            child.on('close', code => {
                cb(code ? `Spawn process '${command}' failed: ${code}` : null);
            });
        } catch (err) {
            return cb(err);
        }
    }

    // MONGO

    static replaceMongoDataToJson (data) {
        for (let key of (data ? Object.keys(data) : [])) {
            if (data[key] instanceof MongoId) {
                data[key] = {
                    $oid: data[key].toString()
                };
            } else if (data[key] instanceof Date) {
                data[key] = {
                    $date: data[key].toISOString()
                };
            } else if (data[key] instanceof Object) {
                this.replaceMongoDataToJson(data[key]);
            }
        }
    }

    static replaceJsonToMongoData (data) {
        for (let key of (data ? Object.keys(data) : [])) {
            if (data[key] && data[key] instanceof Object) {
                if (this.isValidDate(data[key].$date)) {
                    data[key] = new Date(data[key].$date);
                } else if (MongoId.isValid(data[key].$oid)) {
                    data[key] = MongoId(data[key].$oid);
                } else {
                    this.replaceJsonToMongoData(data[key]);
                }
            }
        }
    }
};

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const MongoId = require('mongodb').ObjectID;
const ArrayHelper = require('./ArrayHelper');