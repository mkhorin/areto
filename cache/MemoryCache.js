/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Cache');

module.exports = class MemoryCache extends Base {

    _cache = {};

    getValue (key) {
        const value = this._cache[key];
        if (value) {
            if (value[1] === 0 || value[1] > Date.now()) {
                return value[0];
            }
        }
    }

    setValue (key, value, duration) {
        if (duration) {
            duration = Date.now() + duration * 1000;
        }
        this._cache[key] = [value, duration];
    }

    removeValue (key) {
        if (Object.prototype.hasOwnProperty.call(this._cache, key)) {
            delete this._cache[key];
        }
    }

    flushValues () {
        this._cache = {};
    }
};