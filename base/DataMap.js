/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class DataMap {

    constructor (data) {
        this._data = data || {};
    }

    has (key) {
        return Object.prototype.hasOwnProperty.call(this._data, key);
    }

    get (key, defaults) {
        return this.has(key) ? this._data[key] : defaults;
    }

    set (key, value) {
        this._data[key] = value;
        return this;
    }

    push (key, value) {
        if (Array.isArray(this._data[key])) {
            this._data[key].push(value);
        } else {
            this._data[key] = [value];
        }
        return this;
    }

    unset (key) {
        delete this._data[key];
    }

    clear () {
        this._data = {};
    }

    assign (data) {
        data = data instanceof DataMap ? data._data : data;
        Object.assign(this._data, data);
    }

    keys () {
        return Object.keys(this._data);
    }

    values () {
        return Object.values(this._data);
    }

    entries () {
        return Object.entries(this._data);
    }

    size () {
        return this.values().length;
    }

    each () {
        return this.forEach(...arguments);
    }

    forEach (handler, context) {
        for (const item of this.values()) {
            handler.call(context, item)
        }
        return this;
    }

    filter (handler, context) {
        const result = [];
        for (const item of this.values()) {
            if (handler.call(context, item)) {
                result.push(item);
            }
        }
        return result;
    }

    map (handler, context) {
        const result = [];
        for (const item of this.values()) {
            result.push(handler.call(context, item));
        }
        return result;
    }

    sort (handler) {
        return this.values().sort(handler);
    }

    [Symbol.iterator] () {
        return this.values()[Symbol.iterator]();
    }
};