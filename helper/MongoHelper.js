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
        for (let id of ids) {
            if (!ObjectID.isValid(id)) {
                return false;
            }
        }
        return true;
    }

    static createObjectId () {
        return new ObjectID;
    }
    
    static isEqual (id1, id2) {
        if (id1 instanceof ObjectID) {
            return id1.equals(id2);      
        }
        if (id2 instanceof ObjectID) {
            return id2.equals(id1);
        }
        return id1 === id2;
    }

    static indexOf (id, values) {
        if (!(values instanceof Array)) {
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

    static diff (target, excluded) {
        return ArrayHelper.diff(target, excluded, this.indexOf);
    }

    static intersect (target, excluded) {
        return ArrayHelper.intersect(target, excluded, this.indexOf);
    }

    static uniqueStrict (target, excluded) {
        return ArrayHelper.uniqueStrict(target, excluded, this.indexOf);
    }

    static replaceMongoDataToJson (data) {
        data = data || {};
        for (let key of Object.keys(data)) {
            let value = data[key];
            if (value instanceof ObjectID) {
                data[key] = {'$oid': value.toString()};
            } else if (value instanceof Date) {
                data[key] = {'$date': value.toISOString()};
            } else if (value instanceof Object) {
                this.replaceMongoDataToJson(value);
            }
        }
    }

    static replaceJsonToMongoData (data) {
        data = data || {};
        for (let key of Object.keys(data)) {
            let value = data[key];
            if (!value || !(value instanceof Object)) {
            } else if (DateHelper.isValid(value.$date)) {
                data[key] = new Date(value.$date);
            } else if (ObjectID.isValid(value.$oid)) {
                data[key] = ObjectID(value.$oid);
            } else {
                this.replaceJsonToMongoData(value);
            }
        }
    }
};

const ObjectID = require('mongodb').ObjectID;
const ArrayHelper = require('./ArrayHelper');
const DateHelper = require('./DateHelper');