/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ArrayHelper {

    static includes () {
        return this.indexOf(...arguments) !== -1;
    }

    static indexOf (target, values) {
        target = JSON.stringify(target);
        for (let i = 0; i < values.length; ++i) {
            if (target === JSON.stringify(values[i])) {
                return i;
            }
        }
        return -1;
    }

    static diff (targets, excludes, indexOf) {
        const result = [];
        for (const target of targets) {
            if (indexOf ? indexOf(target, excludes) === -1 : !excludes.includes(target)) {
                result.push(target);
            }
        }
        return result;
    }

    static intersect (sources, targets, indexOf) {
        const result = [];
        for (const source of sources) {
            if (indexOf ? indexOf(source, targets) !== -1 : targets.includes(source)) {
                result.push(source);
            }
        }
        return result;
    }

    static unique (values) {  // cast value to object key
        return Object.keys(this.flip(values));
    }

    static uniqueStrict (values, indexOf) {
        const result = [];
        for (let i = 0; i < values.length; ++i) {
            const value = indexOf ? indexOf(values[i], values) : values.indexOf(values[i]);
            if (value === i) {
                result.push(values[i]);
            }
        }
        return result;
    }

    static flip (values) {
        const result = {};
        if (Array.isArray(values)) {
            for (let i = 0; i < values.length; ++i) {
                result[values[i]] = i;
            }
        }
        return result;
    }

    static concat (values) {
        return Array.isArray(values) ? [].concat(...values) : values;
    }

    static join (values, separator = ', ') {
        return Array.isArray(values) ? values.join(separator) : values;
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

    static getPropertyValues (items, key) {
        const values = [];
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item && Object.prototype.hasOwnProperty.call(item, key)) {
                    values.push(item[key]);
                }
            }
        }
        return values;
    }

    static searchByProperty (value, searchKey, items, returnKey) {
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item && item[searchKey] === value) {
                    return returnKey === undefined ? item : item[returnKey];
                }
            }
        }
    }

    static filterByClassProperty (items, Base, key = 'Class') {
        const result = [];
        if (Array.isArray(items)) {
            for (const item of items) {
                if (item && item[key] && (item[key] === Base || item[key].prototype instanceof Base)) {
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
                const j = Math.floor((i--) * Math.random());
                const t = values[i];
                values[i] = values[j];
                values[j] = t;
            }
            return values;
        }
    }

    // HIERARCHY

    static sortHierarchy (items, keyProperty, parentProperty) {
        let result = [], data = {};
        for (const item of items) {
            if (!item[parentProperty]) {
                result.push(item);
            } else if (Array.isArray(data[item[parentProperty]])) {
                data[item[parentProperty]].push(item);
            } else {
                data[item[parentProperty]] = [item];
            }
        }
        items = result;
        while (items.length) {
            const children = [];
            for (const item of items) {
                const key = item[keyProperty];
                if (Array.isArray(data[key])) {
                    children.push(...data[key]);
                    result.push(...data[key]);
                    delete data[key];
                }
            }
            items = children;
        }
        return result;
    }
};