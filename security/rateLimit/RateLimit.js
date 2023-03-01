/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class RateLimit extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_RATE_UPDATE: 'afterRateUpdate'
        };
    }

    /**
     * @param {Object} config
     * @param {number} config.attempts - Max attempts to pass
     * @param {number|string} config.timeout - Seconds or value for moment.duration()
     * @param {Object} config.types - Separate configurations for types
     */
    constructor (config) {
        super({
            attempts: 3,
            timeout: 0,
            types: {},
            Store: require('./MemoryRateLimitStore'),
            ...config
        });
    }

    init () {
        this.store = this.spawn(this.Store, {rateLimit: this});
        return this.store.init();
    }

    find (type, user) {
        return this.store.find(type, user);
    }

    delete (type, user) {
        return this.store.delete(type, user);
    }

    afterRateUpdate (model) {
        const event = new Event({model});
        return this.trigger(this.EVENT_AFTER_RATE_UPDATE, event);
    }

    getAttempts (type) {
        return this.getInternalParam(type, 'attempts');
    }

    getTimeout (type) {
        return this.getInternalParam(type, 'timeout');
    }

    getInternalParam (type, name) {
        if (!this.types) {
            return this[name];
        }
        if (!Object.prototype.hasOwnProperty.call(this.types, type)) {
            return this[name];
        }
        type = this.types[type];
        if (type && Object.prototype.hasOwnProperty.call(type, name)) {
            return type[name];
        }
        return this[name];
    }
};
module.exports.init();

const Event = require('../../base/Event');