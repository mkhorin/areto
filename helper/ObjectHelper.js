/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ObjectHelper {

    static getValue (key, data, defaults) {
        return data && Object.hasOwn(data, key) ? data[key] : defaults;
    }

    static getValueOrKey (key, data) {
        return this.getValue(key, data, key);
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

    static getValueFromGetterFirst (key, data) {
        if (!data) {
            return;
        }
        if (typeof data.get === 'function') {
            return data.get(key);
        }
        if (Object.hasOwn(data, key)) {
            return data[key];
        }
    }

    static getAllPropertyNames (data) {
        if (!data) {
            return [];
        }
        const names = Object.getOwnPropertyNames(data);
        const allNames = this.getAllPropertyNames(Object.getPrototypeOf(data));
        for (const name of allNames) {
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
        if (data && Array.isArray(keys)) {
            for (const key of keys) {
                if (Object.hasOwn(data, key)) {
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
        return target?.[key]
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

    static replaceKeys (keys, data) {
        if (keys && data) {
            for (const key of Object.keys(data)) {
                if (Object.hasOwn(keys, key)) {
                    if (key !== keys[key]) {
                        data[keys[key]] = data[key];
                        delete data[key];
                    }
                }
            }
        }
    }

    static expandArrayValues (data, keys) {
        const result = [];
        if (data) {
            keys = keys || Object.keys(data);
            for (let i = 0; i < keys.length; ++i) {
                const values = data[keys[i]];
                if (Array.isArray(values)) {
                    const nextKeys = Array.from(keys);
                    nextKeys.splice(i, 1);
                    for (const value of values) {
                        const nextData = {...data, [keys[i]]: value};
                        result.push(...this.expandArrayValues(nextData, nextKeys));
                    }
                    return result;
                }
            }
            result.push(data);
        }
        return result;
    }

    static push (value, key, data) {
        if (Array.isArray(data[key])) {
            data[key].push(value);
        } else if (data) {
            data[key] = [value];
        }
    }

    // DELETE PROPERTIES

    static deleteEmptyProperties (data, names) {
        this.deletePropertiesByValue(this.checkEmptyValue, data, names);
    }

    static checkEmptyValue (value) {
        return value === null || value === '' || value === undefined;
    }

    static deleteEmptyArrayProperties (data, names) {
        this.deletePropertiesByValue(this.checkEmptyArray, data, names);
    }

    static checkEmptyArray (values) {
        return Array.isArray(values) && !values.length;
    }

    static deleteEmptyObjectProperties (data, names) {
        this.deletePropertiesByValue(this.checkEmptyObject, data, names);
    }

    static checkEmptyObject (obj) {
        return obj?.constructor === Object && !Object.values(obj).length;
    }

    static deletePropertiesByValue (value, data, names) {
        if (!data) {
            return;
        }
        if (!Array.isArray(names)) {
            names = Object.keys(data);
        }
        const isFunction = typeof value === 'function';
        for (const name of names) {
            if (isFunction ? value(data[name]) : (data[name] === value)) {
                delete data[name];
            }
        }
    }

    static deleteProperties (names, data) {
        if (Array.isArray(names) && data) {
            for (const name of names) {
                if (Object.hasOwn(data, name)) {
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