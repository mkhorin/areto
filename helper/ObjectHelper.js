/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ObjectHelper {

    static push (value, key, map) {
        if (Array.isArray(map[key])) {
            map[key].push(value);
        } else if (map) {
            map[key] = [value];
        }
    }

    static getValue (key, map, defaults) {
        return map && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : defaults;
    }

    static getValueOrKey (key, map) {
        return map && Object.prototype.hasOwnProperty.call(map, key) ? map[key] : key;
    }

    static getKeyByValue (value, map) {
        if (map) {
            for (let key of Object.keys(map)) {
                if (map[key] === value) {
                    return key;
                }
            }
        }
    }

    static getKeysByValue (value, map) {
        const keys = [];
        if (map) {
            for (let key of Object.keys(map)) {
                if (map[key] === value) {
                    keys.push(key);
                }
            }
        }
        return keys;
    }

    static getAllPropNames (map) {
        if (!map) {
            return [];
        }
        const props = Object.getOwnPropertyNames(map);
        for (let name of this.getAllPropNames(Object.getPrototypeOf(map))) {
            if (props.includes(name) === false) {
                props.push(name);
            }
        }
        return props;
    }

    static getAllFunctionNames (map) {
        const result = [];
        for (let item of this.getAllPropNames(map)) {
            if (typeof map[item] === 'function') {
                result.push(item);
            }
        }
        return result;
    }

    static filterByKeys (keys, map) {
        const result = {};
        if (map) {
            for (let key of keys) {
                if (Object.prototype.hasOwnProperty.call(map, key)) {
                    result[key] = map[key];
                }
            }
        }
        return result;
    }

    static sortByKeys (keys, map) {
        return Object.assign(this.filterByKeys(keys, map), map);
    }

    // DELETE PROPS

    static deleteEmptyProps (map, names) {
        if (map) {
            if (!names) {
                names = Object.keys(map);
            }
            for (let name of names) {
                let value = map[name];
                if (value === null || value === '' || value === undefined) {
                    delete map[name];
                }
            }
        }
    }

    static deletePropsByValue (value, map, names) {
        if (map) {
            if (!names) {
                names = Object.keys(map);
            }
            for (let name of names) {
                if (typeof value === 'function' ? value(map[name]) : (map[name] === value)) {
                    delete map[name];
                }
            }
        }
    }

    static deleteProps (names, map) {
        if (map && Array.isArray(names)) {
            for (let name of names) {
                if (Object.prototype.hasOwnProperty.call(map, name)) {
                    delete map[name];
                }
            }
        }
    }

    static deletePropsExcept (names, map) {
        if (map && Array.isArray(names)) {
            for (let name of Object.keys(map)) {
                if (!names.includes(name)) {
                    delete map[name];
                }
            }
        }
    }

    // NESTED VALUE

    static getNestedValue (key, map, defaults) { // key: 'prop1.prop2.prop3'
        if (!map || typeof key !== 'string') {
            return defaults;
        }
        if (Object.prototype.hasOwnProperty.call(map, key)) {
            return map[key];
        }
        let index = key.indexOf('.');
        if (index < 1) {
            return defaults;
        }
        let token = key.substring(0, index);
        if (!Object.prototype.hasOwnProperty.call(map, token)) {
            return defaults;
        }
        key = key.substring(index + 1);
        map = map[token];
        if (Array.isArray(map)) {
            return map.map(item => this.getNestedValue(key, item, defaults));
        }
        return map ? this.getNestedValue(key, map, defaults) : defaults;
    }

    static setNestedValue (value, key, map) { // key: 'prop1.prop2.prop3'
        let index = key.indexOf('.');
        if (index === -1) {
            return map[key] = value;
        }
        let token = key.substring(0, index);
        if (!Object.prototype.hasOwnProperty.call(map, token) || !(map[token] instanceof Object)) {
            map[token] = {};
        }
        this.setNestedValue(value, key.substring(index + 1), map[token]);
    }

    static addKeyAsNestedValue (nestedKey, map) {
        if (map) {
            for (let key of Object.keys(map)) {
                if (map[key]) {
                    map[key][nestedKey] = key;
                }
            }
        }
    }

    static includesNestedValue () {
        return this.indexOfNestedValue(...arguments) !== -1;
    }

    static indexOfNestedValue (value, key, map) {
        let values = this.getNestedValue(key, map);
        return Array.isArray(values) ? values.indexOf(value) : -1;
    }
};