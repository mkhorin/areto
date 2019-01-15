/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitModel extends Base {

    constructor (config) {
        super(config);
        this._data = {
            'type': this.type,
            'ip': this.user.getIp(),
            'userId': this.user.getId(),
            'counter': 0,
            'blockedTill': null
        };
    }

    isLimited () {
        return this._data.counter >= this.getAttempts();
    }

    isBlocked () {
        return this._data.blockedTill && this._data.blockedTill > new Date;
    }

    getBlockedTill () {
        return this._data.blockedTill;
    }

    increment () {
        this._data.counter += 1;
        if (this.isLimited()) {
            this.setBlockedTill();
        }
        return this.save();
    }

    reset () {
        this._data.counter = 0;
        this._data.blockedTill = null;
        return this.save();
    }

    block (timeout) {
        this.setBlockedTill(timeout);
        return this.save();
    }

    async save () {
        this._data.updatedAt = new Date;
        this._data.createdAt = this._data.createdAt || this._data.updatedAt;
        await this.store.save(this);
        await this.store.rateLimit.afterRateUpdate(this);
    }

    getAttempts () {
        return this.store.rateLimit.getAttempts(this.type);
    }

    getTimeout () {
        return this.store.rateLimit.getTimeout(this.type);
    }

    setData (data) {
        Object.assign(this._data, data);
    }

    getData () {
        return this._data;
    }

    setBlockedTill (timeout) {
        if (timeout === undefined) {
            timeout = this.getTimeout();
        }
        this._data.blockedTill = new Date(Date.now() + timeout * 1000);
    }
};