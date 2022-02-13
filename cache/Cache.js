/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Cache extends Base {

    /**
     * @param {Object} config
     * @param {number} config.defaultDuration - In seconds
     */
    constructor (config) {
        super({
            keyPrefix: null,
            defaultDuration: 100,
            serializer: null,
            ...config
        });
    }

    async use (key, getter, duration) {
        let value = await this.get(key);
        if (value === undefined) {
            value = await getter();
            await this.set(key, value, duration);
        }
        return value;
    }

    async get (key, defaults) {
        key = this.buildKey(key);
        const value = await this.getValue(key);
        if (value === undefined) {
            return defaults;
        }
        this.log('trace', `Get: ${key}`);
        return this.serializer ? this.serializer.parse(value) : value;
    }

    set (key, value, duration) {
        if (!Number.isSafeInteger(duration)) {
            duration = this.defaultDuration;
        }
        key = this.buildKey(key);
        if (this.serializer) {
            value = this.serializer.stringify(value);
        }
        this.log('trace', `Set: ${key}: Duration: ${duration}`);
        return this.setValue(key, value, duration);
    }

    remove (key) {
        key = this.buildKey(key);
        return this.removeValue(key);
    }

    removeValue () {
        // need to override
    }

    flush () {
        return this.flushValues();
    }

    buildKey (key) {
        return this.keyPrefix ? `${this.keyPrefix}${key}` : key;
    }
};