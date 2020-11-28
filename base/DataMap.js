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

    forEach () {
        this.values().forEach(...arguments);
        return this;
    }

    filter () {
        return this.values().filter(...arguments);
    }

    filterMap (handler, context) {
        const result = new this.constructor;
        for (const key of this.keys()) {
            if (handler.call(context, this._data[key], key)) {
                result.set(key, this._data[key]);
            }
        }
        return result;
    }

    map () {
        return this.values().map(...arguments);
    }

    sort () {
        return this.values().sort(...arguments);
    }

    [Symbol.iterator] () {
        return this.values()[Symbol.iterator]();
    }
};