/**
 * @copyright Copyright (c) 2024 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class SimpleCache extends Base {

    _data = {};

    has (key) {
        return Object.hasOwn(this._data, key);
    }

    get (key) {
        if (this.has(key)) {
            return this._data[key];
        }
    }

    set (key, value) {
        this._data[key] = value;
    }

    remove (key) {
        if (this.has(key)) {
            delete this._data[key];
        }
    }

    flush () {
        this._data = {};
    }
};
