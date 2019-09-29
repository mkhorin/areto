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
        if (Array.isArray(keys) && data) {
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

    static hasCircularLinks (target, key, source = target) {
        return target && target[key]
            ? target[key] === source || this.hasCircularLinks(target[key], key, source)
            : false;
    }

    static addKeyAsNestedValue (valueKey, data) {
        if (data) {
            for (const key of Object.keys(data)) {
                if (data[key]) {
                    data[key][valueKey] = key;
                }
            }
        }
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
        if (!Array.isArray(names)) {
            names = Object.keys(data);
        }
        for (const name of names) {
            if (typeof value === 'function' ? value(data[name]) : (data[name] === value)) {
                delete data[name];
            }
        }
    }

    static deleteProperties (names, data) {
        if (Array.isArray(names) && data) {
            for (const name of names) {
                if (Object.prototype.hasOwnProperty.call(data, name)) {
                    delete data[name];
                }
            }
        }
    }

    static deletePropertiesExcept (names, data) {
        if (Array.isArray(names) && data) {
            for (const name of Object.keys(data)) {
                if (!names.includes(name)) {
                    delete data[name];
                }
            }
        }
    }
};