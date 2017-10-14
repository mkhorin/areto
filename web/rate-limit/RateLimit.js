'use strict';

const Base = require('../../base/Component');

module.exports = class RateLimit extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_RATE_UPDATE: 'afterRateUpdate'
        };
    }

    constructor (config) {
        super(Object.assign({
            attempts: 3,
            timeout: 0, // seconds
            types: {}, // separate config for types
            store: require('./MemoryRateLimitStore')
        }, config));
    }

    init () {
        super.init();
        this.store = ClassHelper.createInstance(this.store, {
            rateLimit: this
        });
    }

    configure (cb) {
        this.store.configure(cb);
    }

    find (type, user, cb) {
        this.store.find(type, user, cb);
    }

    remove (type, user, cb) {
        this.store.remove(type, user, cb);
    }

    afterRateUpdate (model, cb) {
        this.triggerCallback(this.EVENT_AFTER_RATE_UPDATE, cb, new Event({model}));
    }

    getAttempts (type) {
        return this.getParam(type, 'attempts');
    }

    getTimeout (type) {
        return this.getParam(type, 'timeout');
    }

    getParam (type, name) {
        if (this.types && Object.prototype.hasOwnProperty.call(this.types, type)) {
            if (this.types[type] && this.types[type].hasOwnProperty(name)) {
                return this.types[type][name];
            }
        }
        return this[name];
    }
};
module.exports.init();

const ClassHelper = require('../../helpers/ClassHelper');
const Event = require('../../base/Event');