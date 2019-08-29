/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ObjectHelper {

    static push (value, key, data) {
        if (Array.isArray(data[key])) {
            data[key].push(value);
        } else if (data) {
            data[key] = [value];
        }
    }

    static getValue (key, data, defaults) {
        return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : defaults;
    }

    static getValueOrKey (key, data) {
        return data && Object.prototype.hasOwnProperty.call(data, key) ? data[key] : key;
    }

    static getKeyByValue (value, data) {
        if (data) {
            for (const key of Object.keys(data)) {
                if (data[key] === value) {
                    return key;
                }
            }
        }
    }

    static getKeysByValue (value, data) {
        const keys = [];
        if (data) {
            for (const key of Object.keys(data)) {
                if (data[key] === value) {
                    keys.push(key);
                }
            }
        }
        return keys;
    }

    static getAllPropertyNames (data) {
        if (!data) {
            return [];
        }
        const names = Object.getOwnPropertyNames(data);
        for (const name of this.getAllPropertyNames(Object.getPrototypeOf(data))) {
            if (!names.includes(name)) {
                names.push(name);
            }
        }
        return names;
    }

    static getAllFunctionNames (data) {
        const result = [];
        for (const item of this.getAllPropertyNames(data)) {
            if (typeof data[item] === 'function') {
                result.push(item);
            }
        }
        return result;
    }

    static filterByKeys (keys, data) {
        const result = {};
        if (data) {
            for (const key of keys) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    result[key] = data[key];
                }
            }
        }
        return result;
    }

    static sortByKeys (keys, data) {
        return Object.assign(this.filterByKeys(keys, data), data);
    }

    // DELETE PROPERTIES

    static deleteEmptyProperties (data, names) {
        if (!data) {
            return;
        }
        if (!names) {
            names = Object.keys(data);
        }
        for (const name of names) {
            const value = data[name];
            if (value === null || value === '' || value === undefined) {
                delete data[name];
            }
        }
    }

    static deletePropertiesByValue (value, data, names) {
        if (!data) {
            return;
        }
        if (!names) {
            names = Object.keys(data);
        }
        for (const name of names) {
            if (typeof value === 'function' ? value(data[name]) : (data[name] === value)) {
                delete data[name];
            }
        }
    }

    static deleteProperties (names, data) {
        if (data && Array.isArray(names)) {
            for (const name of names) {
                if (Object.prototype.hasOwnProperty.call(data, name)) {
                    delete data[name];
                }
            }
        }
    }

    static deletePropertiesExcept (names, data) {
        if (data && Array.isArray(names)) {
            for (const name of Object.keys(data)) {
                if (!names.includes(name)) {
                    delete data[name];
                }
            }
        }
    }

    // NESTED VALUE

    static getNestedValue (key, data, defaults) { // key: 'property1.property2.property3'
        if (!data || typeof key !== 'string') {
            return defaults;
        }
        if (Object.prototype.hasOwnProperty.call(data, key)) {
            return data[key];
        }
        const index = key.indexOf('.');
        if (index < 1) {
            return defaults;
        }
        const token = key.substring(0, index);
        if (!Object.prototype.hasOwnProperty.call(data, token)) {
            return defaults;
        }
        key = key.substring(index + 1);
        data = data[token];
        if (Array.isArray(data)) {
            return data.map(item => this.getNestedValue(key, item, defaults));
        }
        return data ? this.getNestedValue(key, data, defaults) : defaults;
    }

    static setNestedValue (value, key, data) { // key: 'property1.property2.property3'
        const index = key.indexOf('.');
        if (index === -1) {
            return data[key] = value;
        }
        const token = key.substring(0, index);
        if (!Object.prototype.hasOwnProperty.call(data, token) || !(data[token] instanceof Object)) {
            data[token] = {};
        }
        this.setNestedValue(value, key.substring(index + 1), data[token]);
    }

    static addKeyAsNestedValue (nestedKey, data) {
        if (data) {
            for (const key of Object.keys(data)) {
                if (data[key]) {
                    data[key][nestedKey] = key;
                }
            }
        }
    }

    static includesNestedValue () {
        return this.indexOfNestedValue(...arguments) !== -1;
    }

    static indexOfNestedValue (value, key, data) {
        const values = this.getNestedValue(key, data);
        return Array.isArray(values) ? values.indexOf(value) : -1;
    }
};