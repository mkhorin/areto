/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class NestedHelper {

    static get (key, data, defaults) {
        if (!data || typeof key !== 'string') {
            return defaults;
        }
        if (Object.hasOwn(data, key)) {
            return data[key];
        }
        const index = key.indexOf('.');
        if (index < 1) {
            return defaults;
        }
        const token = key.substring(0, index);
        if (!Object.hasOwn(data, token)) {
            return defaults;
        }
        key = key.substring(index + 1);
        data = data[token];
        if (Array.isArray(data)) {
            return data.map(item => this.get(key, item, defaults));
        }
        return data
            ? this.get(key, data, defaults)
            : defaults;
    }

    static getAlone (key, data, defaults) {
        if (!data || typeof key !== 'string') {
            return defaults;
        }
        if (Object.hasOwn(data, key)) {
            return data[key];
        }
        const index = key.indexOf('.');
        if (index < 1) {
            return defaults;
        }
        const token = key.substring(0, index);
        if (!Object.hasOwn(data, token)) {
            return defaults;
        }
        key = key.substring(index + 1);
        return this.getAlone(key, data[token], defaults);
    }

    static set (value, key, data) {
        const index = key.indexOf('.');
        if (index === -1) {
            return data[key] = value;
        }
        const token = key.substring(0, index);
        if (!(data[token] instanceof Object)) {
            data[token] = {};
        }
        key = key.substring(index + 1);
        this.set(value, key, data[token]);
    }

    static includes () {
        return this.indexOf(...arguments) !== -1;
    }

    static indexOf (value, key, data) {
        const values = this.get(key, data);
        return Array.isArray(values) ? values.indexOf(value) : -1;
    }
};