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

    use (key, getter, cb, duration) {
        this.get(key, (err, value)=> {
            if (err) {
                return cb(err);
            }
            if (value !== undefined) {
                return cb(null, value);
            }
            getter((err, value)=> {
                if (err) {
                    return cb(err);
                }
                this.set(key, value, duration, err => {
                    cb(err, value);
                }); 
            });
        });
    }

    get (key, cb) {
        key = this.buildKey(key);
        this.getValue(key, (err, value)=> {
            if (err || value === undefined) {
                return cb(err);
            }
            this.log('trace', `Get key: ${key}`);
            if (this.serializer) {
                value = this.serializer.parse(value);
            }
            cb(null, value);
        });
    }

    set (key, value, duration, cb) {
        if (!Number.isInteger(duration)) {
            duration = this.duration;
        }
        key = this.buildKey(key);
        if (this.serializer) {
            value = this.serializer.stringify(value);
        }
        this.log('trace', `Set key: ${key}: Duration: ${duration}`);
        this.setValue(key, value, duration, cb);
    }

    remove (key, cb) {
        key = this.buildKey(key);
        this.removeValue(key, cb);
    }

    flush (cb) {        
        this.flushValues(cb);
    }

    getValue (key, cb) {
        cb();
    }

    setValue (key, value, duration, cb) {
        cb();
    }

    removeValue (key, cb) {
        cb();
    }

    flushValues (cb) {
        cb();
    }

    buildKey (key) {
        return this.keyPrefix ? `${this.keyPrefix}${key}` : key;
    }
};