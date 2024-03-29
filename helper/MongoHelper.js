/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MongoHelper {

    static isObjectId (id) {
        return id instanceof ObjectId;
    }

    static isValidId (id) {
        return ObjectId.isValid(id);
    }

    static isValidIds (ids) {
        if (!Array.isArray(ids)) {
            return false;
        }
        for (const id of ids) {
            if (!ObjectId.isValid(id)) {
                return false;
            }
        }
        return true;
    }

    static createId (value) {
        return value
            ? new ObjectId(value)
            : new ObjectId;
    }

    static normalizeId (data) {
        return Array.isArray(data)
            ? data.map(this.normalizeOneId, this)
            : this.normalizeOneId(data);
    }

    static normalizeOneId (value) {
        if (value instanceof ObjectId) {
            return value;
        }
        return ObjectId.isValid(value)
            ? new ObjectId(value)
            : null;
    }

    static includes () {
        return this.indexOf(...arguments) !== -1;
    }

    static indexOf (target, values) {
        if (!(target instanceof ObjectId)) {
            return ArrayHelper.indexOf(target, values);
        }
        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; ++i) {
                if (target.equals(values[i])) {
                    return i;
                }
            }
        }
        return -1;
    }

    static hasDiff (targets, sources) {
        return ArrayHelper.hasDiff(targets, sources, this.indexOf);
    }

    static diff (targets, sources) {
        return ArrayHelper.diff(targets, sources, this.indexOf);
    }

    static exclude (targets, sources) {
        return ArrayHelper.exclude(targets, sources, this.indexOf);
    }

    static intersect (sources, targets) {
        return ArrayHelper.intersect(sources, targets, this.indexOf);
    }

    static uniqueStrict (values) {
        return ArrayHelper.uniqueStrict(values, this.indexOf);
    }

    static normalizeExportData (data) {
        data = data || {};
        for (const key of Object.keys(data)) {
            const value = data[key];
            if (value instanceof ObjectId) {
                data[key] = {$oid: value.toString()};
            } else if (value instanceof Date) {
                data[key] = {$date: value.toISOString()};
            } else if (value instanceof Object) {
                this.normalizeExportData(value);
            }
        }
    }

    static normalizeImportData (data) {
        data = data || {};
        for (const key of Object.keys(data)) {
            const value = data[key];
            if (!value || !(value instanceof Object)) {
            } else if (DateHelper.isValid(value.$date)) {
                data[key] = new Date(value.$date);
            } else if (ObjectId.isValid(value.$oid)) {
                data[key] = new ObjectId(value.$oid);
            } else {
                this.normalizeImportData(value);
            }
        }
    }

    static convertToRegex (value) {
        if (value instanceof RegExp) {
            return value;
        }
        value = EscapeHelper.escapeRegex(value);
        value = value[0] === '%'
            ? value.substring(1)
            : `^${value}`;
        value = value[value.length - 1] === '%'
            ? value.substring(0, value.length - 1)
            : `${value}$`;
        return new RegExp(value, 'i');
    }
};

const {ObjectId} = require('mongodb');
const ArrayHelper = require('./ArrayHelper');
const DateHelper = require('./DateHelper');
const EscapeHelper = require('./EscapeHelper');