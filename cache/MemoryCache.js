'use strict';

const Base = require('./Cache');

module.exports = class MemoryCache extends Base {

    constructor (config) {
        super(config);
        this._cache = {};
    }

    getValue (key) {
        let value = this._cache[key];
        return value && (value[1] === 0 || value[1] > Date.now())
            ? Promise.resolve(value[0])
            : Promise.resolve();
    }

    setValue (key, value, duration) {
        if (duration) {
            duration = Date.now() + duration * 1000;
        }
        this._cache[key] = [value, duration];
        return Promise.resolve();
    }

    removeValue (key) {
        if (Object.prototype.hasOwnProperty.call(this._cache, key)) {
            delete this._cache[key];
        }
        return Promise.resolve();
    }

    flushValues () {
        this._cache = {};
        return Promise.resolve();
    }
};