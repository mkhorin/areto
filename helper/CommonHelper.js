/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class CommonHelper {

    static isEmpty (value) {
        return value === undefined || value === null || value === '';
    }

    static isEqual (a, b) {
        return a === b || JSON.stringify(a) === JSON.stringify(b);
    }

    static log (logger, prefix, type, message, data) {
        logger = logger || console;
        if (typeof message === 'string') {
            return logger.log(type, prefix ? `${prefix}: ${message}` : message, data);
        }
        prefix ? logger.log(type, `${prefix}:`, message)
               : logger.log(type, message);
    }

    static parseJson (data) {
        if (typeof data !== 'string') {
            return data;
        }
        try {
            return JSON.parse(data);
        } catch {}
    }

    static parseRelationChanges (data) {
        if (data && typeof data === 'string') {
            try {
                data = JSON.parse(data);
            } catch {
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
        if (!Array.isArray(data.deletes)) {
            data.deletes = [];
        }
        const all = data.links.concat(data.unlinks, data.deletes);
        return all.length === ArrayHelper.unique(all).length ? data : false;
    }
};

const ArrayHelper = require('./ArrayHelper');