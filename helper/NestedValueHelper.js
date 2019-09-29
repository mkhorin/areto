/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class NestedValueHelper {

    static get (key, data, defaults) { // key: 'prop1.prop2.prop3'
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
            return data.map(item => this.get(key, item, defaults));
        }
        return data ? this.get(key, data, defaults) : defaults;
    }

    static set (value, key, data) { // key: 'prop1.prop2.prop3'
        const index = key.indexOf('.');
        if (index === -1) {
            return data[key] = value;
        }
        const token = key.substring(0, index);
        if (!(data[token] instanceof Object)) {
            data[token] = {};
        }
        this.set(value, key.substring(index + 1), data[token]);
    }

    static includes () {
        return this.indexOf(...arguments) !== -1;
    }

    static indexOf (value, key, data) {
        const values = this.get(key, data);
        return Array.isArray(values) ? values.indexOf(value) : -1;
    }
};