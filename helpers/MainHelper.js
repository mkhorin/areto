'use strict';

module.exports = class MainHelper {

    static isEmpty (value) {
        return value === undefined || value === null || value === '';
    }

    static isEqualIds (id1, id2) {
        return id1 instanceof MongoId ? id1.equals(id2) : id1 === id2;
    }

    static indexOfId (id, ids) {
        if (!(id instanceof MongoId)) {
            return ids.indexOf(id);
        }
        for (let i = 0; i < ids.length; ++i) {
            if (id.equals(ids[i])) return i;
        }
        return -1;
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
        if (args instanceof Array) {
            for (let item of args) {
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
        }
        return result;
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
        return text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    }

    static escapeHtml (html) {
        return String(html).replace(/&(?!#?[a-zA-Z0-9]+;)/g, '&amp;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;').replace(/"/g, '&quot;');
    }

    // CLASS INSTANCE

    static createInstance (config, params) {
        if (typeof config === 'function') {
            return new config(params);
        }
        if (params) {
            Object.assign(config, params);
        }
        return config && config.Class ? new config.Class(config) : null;
    }
   
    // get value from Class[name] and (new Class)[name]
    static defineClassProperty (Class, name, value, writable) {
        Object.defineProperty(Class, name, {value, writable});
        Object.defineProperty(Class.prototype, name, {value, writable});
    }

    static getClosestDirByTarget (file, target) {
        let dir = path.dirname(file);
        if (dir === file) {
            return null;
        } else if (this.isFileInDir(target, dir)) {
            return dir;
        } else {
            return this.getClosestDirByTarget(dir, target);
        }
    }

    static isFileInDir (filename, dir) {
        try {
            let stat = fs.statSync(path.join(dir, filename));
            return stat && stat.isFile();
        } catch (err) {
            return false;
        }
    }    
};

const fs = require('fs');
const path = require('path');
const MongoId = require('mongodb').ObjectID;