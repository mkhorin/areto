/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
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
        super(Object.assign({
            attempts: 3,
            timeout: 0, // seconds
            types: {}, // separate config for types
            store: require('./MemoryRateLimitStore')
        }, config));
        
        this.store = ClassHelper.createInstance(this.store, {
            rateLimit: this
        });
    }

    init () {
        return this.store.init();
    }

    find (type, user) {
        return this.store.find(type, user);
    }

    remove (type, user) {
        return this.store.remove(type, user);
    }

    afterRateUpdate (model) {
        return this.triggerWait(this.EVENT_AFTER_RATE_UPDATE, new Event({model}));
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

const ClassHelper = require('../../helper/ClassHelper');
const Event = require('../../base/Event');