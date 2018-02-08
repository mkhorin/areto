'use strict';

module.exports = class DataMap {

    constructor (data) {
        this._data = data || {};
    }

    has (key) {
        return Object.prototype.hasOwnProperty.call(this._data, key);
    }

    get (key, defaults) {
        return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : defaults;
    }

    set (key, value) {
        this._data[key] = value;
    }

    unset (key) {
        delete this._data[key];
    }
};