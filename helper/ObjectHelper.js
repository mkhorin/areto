/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ObjectHelper {

    static push (value, key, map) {
        if (map[key] instanceof Array) {
            map[key].push(value);
        } else if(map) {
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
        if (map instanceof Array) {
            return map.map(item => this.getNestedValue(key, item, defaults));
        }
        return map ? this.getNestedValue(key, map, defaults)
            : defaults;
    }

    static setNestedValue (key, value, map) { // key: 'prop1.prop2.prop3'
        let index = key.indexOf('.');
        if (index ===  -1) {
            return map[key] = value;
        }
        let token = key.substring(0, index);
        if (!Object.prototype.hasOwnProperty.call(map, token) || !(map[token] instanceof Object)) {
            map[token] = {};
        }
        this.setNestedValue(key.substring(index + 1), value, map[token]);
    }

    static getAllPropNames (map) {
        if (!map) {
            return [];
        }
        let props = Object.getOwnPropertyNames(map);
        for (let name of this.getAllPropNames(Object.getPrototypeOf(map))) {
            if (props.includes(name) === false) {
                props.push(name);
            }
        }
        return props;
    }

    static getAllFunctionNames (map) {
        return this.getAllPropNames(map).filter(item => typeof map[item] === 'function');
    }

    static deleteEmptyProps (map, isEmpty) {
        if (map) {
            for (let key of Object.keys(map)) {
                let value = map[key];
                if (isEmpty ? isEmpty(value) : (value === null || value === '' || value === undefined)) {
                    delete map[key];
                }
            }
        }
    }

    static deleteProps (names, map) {
        if (map && names instanceof Array) {
            for (let name of names) {
                if (Object.prototype.hasOwnProperty.call(map, name)) {
                    delete map[name];
                }
            }
        }
    }

    static deletePropsExcept (names, map) {
        if (map && names instanceof Array) {
            for (let key of Object.keys(map)) {
                if (!names.includes(key)) {
                    delete map[key];
                }
            }
        }
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
};