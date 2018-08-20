'use strict';

const Base = require('./Cache');

module.exports = class MemoryCache extends Base {

    constructor (config) {
        super(config);
        this._cache = {};
    }

    getValue (key, cb) {
        let value = this._cache[key];
        value && (value[1] === 0 || value[1] > Date.now())
            ? cb(null, value[0])
            : cb();
    }

    setValue (key, value, duration, cb) {
        if (duration) {
            duration = Date.now() + duration * 1000;
        }
        this._cache[key] = [value, duration];
        cb();
    }

    removeValue (key, cb) {
        if (Object.prototype.hasOwnProperty.call(this._cache, key)) {
            delete this._cache[key];
        }
        cb();
    }

    flushValues (cb) {
        this._cache = {};
        cb();
    }
};