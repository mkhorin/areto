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

    static defineConstantProperty (object, name, value) {
        return Object.defineProperty(object, name, {
            configurable: false,
            enumerable: true,
            value: value,
            writable: false
        });
    }

    static log (logger, prefix, type, message, data) {
        logger = logger || console;
        if (typeof message === 'string') {
            logger.log(type, prefix ? `${prefix}: ${message}` : message, data);
        } else {
            prefix ? logger.log(type, `${prefix}:`, message)
                   : logger.log(type, message);
        }
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
            } catch {}
        }
        if (!data) {
            return null;
        }
        if (!data.links && !data.unlinks && !data.deletes) {
            data = {links: data};
        }
        this.resolveRelationChangeAction('links', data);
        this.resolveRelationChangeAction('unlinks', data);
        this.resolveRelationChangeAction('deletes', data);
        return this.isRelationChangeUnique(data) ? data : null;
    }

    static resolveRelationChangeAction (action, data) {
        if (!Array.isArray(data[action])) {
            data[action] = data[action] ? [data[action]] : [];
        }
    }

    static isRelationChangeUnique (data) {
        const all = data.links.concat(data.unlinks, data.deletes);
        return ArrayHelper.unique(all).length === all.length;
    }
};

const ArrayHelper = require('./ArrayHelper');