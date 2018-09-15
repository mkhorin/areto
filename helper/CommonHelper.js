/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class CommonHelper {

    static log (type, message, data, prefix, logger) {
        logger = logger || console;
        if (typeof message === 'string') {
            return logger.log(type, `${prefix}: ${message}`, data);
        }
        logger.log(type, `${prefix}:`, message);
    }

    static isEmpty (value) {
        return value === undefined || value === null || value === '';
    }

    static getRandom (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static parseJson (data) {
        try {
            return JSON.parse(data);
        } catch (err) {}
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
        date = new Date(date);
        return Object.prototype.toString.call(date) !== '[object Date]' ? false : !isNaN(date.getTime());
    }

    static getValidDate (date) {
        return this.isValidDate(date) ? new Date(date) : null;
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

    // SYSTEM

    static isWinPlatform () {
        return /^win/.test(process.platform);
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

    static spawnProcess (path, command, args) {
        if (this.isWinPlatform()) {
            command += '.cmd';
        }
        let child = childProcess.spawn(command, args, {
            cwd: path,
            env: process.env
        });
        child.stdout.on('data', data => console.log(`${data}`));
        child.stderr.on('data', data => console.error(`${data}`));
        return new Promise((resolve, reject)=> {
            child.on('close', code => {
                code ? reject(`Spawn process: ${command}: failed: ${code}`)
                     : resolve();
            });
        });
    }
};

const childProcess = require('child_process');
const ArrayHelper = require('./ArrayHelper');
