'use strict';

module.exports = class ArrayHelper {

    static diff (target, excluded, indexOf) {
        let result = [];
        for (let item of target) {
            if (indexOf ? indexOf(item, excluded) === -1 : !excluded.includes(item)) {
                result.push(item);
            }
        }
        return result;
    }

    static intersect (source, target, indexOf) {
        let result = [];
        for (let item of source) {
            if (indexOf ? indexOf(item, target) !== -1 : target.includes(item)) {
                result.push(item);
            }
        }
        return result;
    }

    static unique (values, indexOf) {
        let result = [];
        for (let i = 0; i < values.length; ++i) {
            if ((indexOf ? indexOf(values[i], values) : values.indexOf(values[i])) === i) {
                result.push(values[i]);
            }
        }
        return result;
    }

    static flip (values) {
        let object = {};
        for (let value of values) {
            object[value] = null;
        }
        return object;
    }

    static indexOfId (id, ids) {
        if (!(id instanceof MongoId)) {
            return ids.indexOf(id);
        }
        for (let i = 0; i < ids.length; ++i) {
            if (id.equals(ids[i])) {
                return i;
            }
        }
        return -1;
    }

    static getValueByKey (key, keyProp, valueProp, objects) {
        for (let object of objects) {
            if (object[keyProp] === key) {
                return object[valueProp];
            }
        }
    }

    static indexObjects (docs, key) {
        let map = {};
        for (let doc of docs) {
            if (doc !== null) {
                let value = doc[key];
                if (Object.prototype.hasOwnProperty.call(map, value)) {
                    if (map[value] instanceof Array) {
                        map[value].push(doc);
                    } else {
                        map[value] = [map[value], doc];
                    }
                } else {
                    map[value] = doc;
                }
            }
        }
        return map;
    }

    static indexModels (models, key) {
        let map = {};
        for (let model of models) {
            let value = model.get(key);
            if (Object.prototype.hasOwnProperty.call(map, value)) {
                if (map[value] instanceof Array) {
                    map[value].push(model);
                } else {
                    map[value] = [map[value], model];
                }
            } else {
                map[value] = model;
            }
        }
        return map;
    }

    // RANDOM

    static getRandom (values) {
        return values.length ? values[Math.floor(Math.random() * values.length)] : null;
    }

    static shuffle (values) {
        let i = values.length;
        while (i) {
            let j = Math.floor((i--) * Math.random());
            let t = values[i];
            values[i] = values[j];
            values[j] = t;
        }
        return values;
    }

    static getObjectPropValues (items, prop) {
        let values = [];
        for (let item of items) {
            if (item && Object.prototype.hasOwnProperty.call(item, prop)) {
                values.push(item[prop]);
            }
        }
        return values;
    }

    static searchObject (items, searchProp, searchValue, returnProp) {
        if (items instanceof Array) {
            for (let item of items) {
                if (item && item[searchProp] === searchValue) {
                    return returnProp === undefined ? item : item[returnProp];
                }
            }
        }
    }
};

const MongoId = require('mongodb').ObjectID;