'use strict';

module.exports = class ArrayHelper {

    static diff (target, excluded) {
        return target.filter(item => excluded.indexOf(item) < 0);
    }

    static intersect (source, target) {
        let result = [];
        for (let item of source) {
            target.includes(item) && result.push(item);
        }
        return result;
    }

    static unique (values) {
        return values.filter((value, index)=> values.indexOf(value) === index);
    }

    static flip (values) {
        let object = {};
        for (let value of values) {
            object[value] = null;
        }
        return object;
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
        return null;
    }

    // INDEX

    static indexObjects (docs, key) {
        let map = {};
        for (let doc of docs) {
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
};