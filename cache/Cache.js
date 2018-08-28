'use strict';

const Base = require('../base/Component');

module.exports = class Cache extends Base {

    constructor (config) {
        super(Object.assign({
            keyPrefix: null,
            duration: 100, // seconds
            serializer: null
        }, config));
    }

    async use (key, getter, duration) {
        let value = await this.get(key);
        if (value === undefined) {
            value = await getter();
            await this.set(key, value, duration);
        }
        return value;
    }

    async get (key) {
        key = this.buildKey(key);
        let value = await this.getValue(key);
        if (value !== undefined) {
            this.log('trace', `Get key: ${key}`);
            return this.serializer ? this.serializer.parse(value) : value;
        }
    }

    set (key, value, duration) {
        if (!Number.isInteger(duration)) {
            duration = this.duration;
        }
        key = this.buildKey(key);
        if (this.serializer) {
            value = this.serializer.stringify(value);
        }
        this.log('trace', `Set key: ${key}: Duration: ${duration}`);
        return this.setValue(key, value, duration);
    }

    remove (key) {
        key = this.buildKey(key);
        return this.removeValue(key);
    }

    flush () {        
        return this.flushValues();
    }

    buildKey (key) {
        return this.keyPrefix
            ? `${this.keyPrefix}${key}`
            : key;
    }
};