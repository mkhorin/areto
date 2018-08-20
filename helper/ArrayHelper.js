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

    static unique (values) {  // cast value to object key
        return Object.keys(this.flip(values));
    }

    static uniqueStrict (values, indexOf) {
        let result = [];
        for (let i = 0; i < values.length; ++i) {
            if ((indexOf ? indexOf(values[i], values) : values.indexOf(values[i])) === i) {
                result.push(values[i]);
            }
        }
        return result;
    }

    static flip (values) {
        let map = {};
        for (let i = 0; i < values.length; ++i) {
            map[values[i]] = i;
        }
        return map;
    }

    static removeValue (value, values) {
        value = values.indexOf(value);
        if (value === -1) {
            return false;
        }
        values.splice(value, 1);
        return true;
    }

    static getValueByKey (key, keyProp, objects, returnProp) {
        for (let object of objects) {
            if (object[keyProp] === key) {
                return returnProp === undefined ? object : object[returnProp];
            }
        }
    }

    static concatValues (values) {
        return values instanceof Array
            ? Array.prototype.concat.apply([], values)
            : values;
    }

    // INDEX

    static indexObjects (docs, keyProp, valueProp) {
        let map = {};
        for (let doc of docs) {
            if (doc === null || doc === undefined) {
                continue;
            }
            let value = valueProp === undefined ? doc : doc[valueProp];
            let key = doc[keyProp];
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                if (map[key] instanceof Array) {
                    map[key].push(value);
                } else {
                    map[key] = [map[key], value];
                }
            } else {
                map[key] = value;
            }
        }
        return map;
    }

    static indexUniqueObjects (docs, keyProp, valueProp) {
        let map = {};
        for (let doc of docs) {
            if (doc !== null && doc !== undefined) {
                map[doc[keyProp]] = valueProp === undefined ? doc : doc[valueProp];
            }
        }
        return map;
    }

    static indexModels (models, keyAttr, valueAttr) {
        let map = {};
        for (let model of models) {
            let value = valueAttr ? model.get(valueAttr) : model;
            let key = model.get(keyAttr);
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                if (map[key] instanceof Array) {
                    map[key].push(value);
                } else {
                    map[key] = [map[key], value];
                }
            } else {
                map[key] = value;
            }
        }
        return map;
    }

    static indexUniqueModels (models, keyAttr, valueAttr) {
        let map = {};
        for (let model of models) {
            map[model.get(keyAttr)] = valueAttr ? model.get(valueAttr) : model;
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

    static searchByProperty (value, items, searchProp, returnProp) {
        if (items instanceof Array) {
            for (let item of items) {
                if (item && item[searchProp] === value) {
                    return returnProp === undefined ? item : item[returnProp];
                }
            }
        }
    }

    // HIERARCHY
    // order children after parents
    static sortHierarchy (items, idProp, parentProp) {
        let result = [], map = {};
        for (let item of items) {
            if (item[parentProp]) {
                if (map[item[parentProp]] instanceof Array) {
                    map[item[parentProp]].push(item);
                } else {
                    map[item[parentProp]] = [item];
                }
            } else {
                result.push(item);
            }
        }
        for (let i = 0; i < result.length; ++i) {
            let item = result[i];
            if (map[item[idProp]] instanceof Array) {
                result = result.concat(map[item[idProp]]);
            }
        }
        return result;
    }
};