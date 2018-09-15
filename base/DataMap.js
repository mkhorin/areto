/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
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
    }

    unset (key) {
        delete this._data[key];
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
};