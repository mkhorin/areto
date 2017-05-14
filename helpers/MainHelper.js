'use strict';

const fs = require('fs');
const path = require('path');
const MongoId = require('mongodb').ObjectID;

module.exports = class MainHelper {
    
    static isEqualIds (id1, id2) {
        return id1 instanceof MongoId ? id1.equals(id2) : id1 === id2;
    }

    static getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static parseJson (data) {
        try {
            return JSON.parse(data);
        } catch (err) {
            return null;
        }
    }

    static getScriptArgs () {
        return process.argv.slice(process.execArgv.length + 2);
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
   
    // can get from Class['name'] and (new Class)['name']
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