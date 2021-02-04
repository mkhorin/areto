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

    constructor (config) {
        super({
            attempts: 3,
            timeout: 0, // seconds or [2d]
            types: {}, // separate configurations for types
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
        return this.trigger(this.EVENT_AFTER_RATE_UPDATE, new Event({model}));
    }

    getAttempts (type) {
        return this.getInternalParam(type, 'attempts');
    }

    getTimeout (type) {
        return this.getInternalParam(type, 'timeout');
    }

    getInternalParam (type, name) {
        if (!this.types || !Object.prototype.hasOwnProperty.call(this.types, type)) {
            return this[name];
        }
        type = this.types[type];
        return type && Object.prototype.hasOwnProperty.call(type, name) ? type[name] : this[name];
    }
};
module.exports.init();

const Event = require('../../base/Event');