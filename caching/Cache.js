'use strict';

let Base = require('../base/Component');

module.exports = class Cache extends Base {

    constructor (config) {
        super(Object.assign({
            keyPrefix: null,
            duration: 100,
            serializer: null
        }, config));
    }

    use (key, getter, cb, duration) {
        this.get(key, (err, value)=> {
            err || value ? cb(err, value) : getter((err, value)=> {
                err ? cb(err) : this.set(key, value, duration, err => {
                    cb(err, value);
                }); 
            });
        });
    }

    buildKey (key) {
        return this.keyPrefix ? `${this.keyPrefix}${key}` : key;
    }

    get (key, cb) {
        key = this.buildKey(key);
        if (this.serializer) {
            this.getValue(key, (err, value)=> {
                err ? cb(err) : value ? this.serializer.parse(value) : value;
            });
        } else {
            this.getValue(key, cb);
        }
    }

    set (key, value, duration, cb) {
        if (!Number.isInteger(duration)) {
            duration = this.duration;
        }
        key = this.buildKey(key);
        if (this.serializer && value) {
            value = this.serializer.stringify(value);
        }
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
};