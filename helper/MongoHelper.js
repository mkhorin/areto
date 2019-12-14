/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class MongoHelper {

    static isObjectId (id) {
        return id instanceof ObjectID;
    }

    static isValidId (id) {
        return ObjectID.isValid(id);
    }

    static isValidIds (ids) {
        if (!Array.isArray(ids)) {
            return false;
        }
        for (const id of ids) {
            if (!ObjectID.isValid(id)) {
                return false;
            }
        }
        return true;
    }

    static createObjectId (value) {
        return value ? ObjectID(value) : new ObjectID;
    }

    static indexOf (id, values) {
        if (!Array.isArray(values)) {
            return -1;
        }
        if (!(id instanceof ObjectID)) {
            return values.indexOf(id);
        }
        for (let i = 0; i < values.length; ++i) {
            if (id.equals(values[i])) {
                return i;
            }
        }
        return -1;
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
            if (value instanceof ObjectID) {
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
            } else if (ObjectID.isValid(value.$oid)) {
                data[key] = ObjectID(value.$oid);
            } else {
                this.normalizeImportData(value);
            }
        }
    }
};

const ObjectID = require('mongodb').ObjectID;
const ArrayHelper = require('./ArrayHelper');
const DateHelper = require('./DateHelper');