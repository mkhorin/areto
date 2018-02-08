'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitModel extends Base {

    init () {
        this._data = {
            type: this.type,
            ip: this.user.getIp(),
            userId: this.user.getId(),
            counter: 0,
            blockedTill: null
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

    increment (cb) {
        this._data.counter += 1;
        if (this.isLimited()) {
            this.setBlockedTill();
        }
        this.save(cb);
    }

    reset (cb) {
        this._data.counter = 0;
        this._data.blockedTill = null;
        this.save(cb);
    }

    block (cb, timeout) {
        this.setBlockedTill(timeout);
        this.save(cb);
    }

    save (cb) {
        this._data.updatedAt = new Date;
        this._data.createdAt = this._data.createdAt || this._data.updatedAt;
        AsyncHelper.series([
            cb => this.store.save(this, cb),
            cb => this.store.rateLimit.afterRateUpdate(this, cb)
        ], cb);
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
        timeout = timeout === undefined ? this.getTimeout() : timeout;
        this._data.blockedTill = new Date((new Date).getTime() + timeout * 1000);
    }
};

const AsyncHelper = require('../../helpers/AsyncHelper');