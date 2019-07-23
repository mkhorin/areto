/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
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
            let value = indexOf ? indexOf(values[i], values) : values.indexOf(values[i]);
            if (value === i) {
                result.push(values[i]);
            }
        }
        return result;
    }

    static flip (values) {
        let result = {};
        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; ++i) {
                result[values[i]] = i;
            }
        }
        return result;
    }

    static removeValue (value, values) {
        if (!Array.isArray(values)) {
            return false;
        }
        value = values.indexOf(value);
        if (value === -1) {
            return false;
        }
        values.splice(value, 1);
        return true;
    }

    static concatValues (values) {
        return Array.isArray(values) ? [].concat(...values) : values;
    }

    static getObjectPropValues (items, prop) {
        let values = [];
        if (Array.isArray(items)) {
            for (let item of items) {
                if (item && Object.prototype.hasOwnProperty.call(item, prop)) {
                    values.push(item[prop]);
                }
            }
        }
        return values;
    }

    static searchByProp (value, searchProp, items, returnProp) {
        if (Array.isArray(items)) {
            for (let item of items) {
                if (item && item[searchProp] === value) {
                    return returnProp === undefined ? item : item[returnProp];
                }
            }
        }
    }

    static filterByClassProp (items, Base, prop = 'Class') {
        let result = [];
        if (Array.isArray(items)) {
            for (let item of items) {
                if (item && item[prop] && (item[prop] === Base || item[prop].prototype instanceof Base)) {
                    result.push(item);
                }
            }
        }
        return result;
    }

    // RANDOM

    static getRandom (values) {
        if (Array.isArray(values) && values.length) {
            return values[Math.floor(Math.random() * values.length)];
        }
    }

    static shuffle (values) {
        if (Array.isArray(values)) {
            let i = values.length;
            while (i) {
                let j = Math.floor((i--) * Math.random());
                let t = values[i];
                values[i] = values[j];
                values[j] = t;
            }
            return values;
        }
    }

    // HIERARCHY
    // order children after parents
    static sortHierarchy (items, idProp, parentProp) {
        let result = [], map = {};
        for (let item of items) {
            if (!item[parentProp]) {
                result.push(item);
            } else if (Array.isArray(map[item[parentProp]])) {
                map[item[parentProp]].push(item);
            } else {
                map[item[parentProp]] = [item];
            }
        }
        for (let i = 0; i < result.length; ++i) {
            let item = result[i];
            if (Array.isArray(map[item[idProp]])) {
                result = result.concat(map[item[idProp]]);
            }
        }
        return result;
    }
};