/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitModel extends Base {

    _data = {
        type: this.type,
        ip: this.user.getIp(),
        userId: this.user.getId(),
        counter: 0,
        unlockAt: null
    };

    isExceeded () {
        return this._data.counter >= this.getAttempts();
    }

    isBlocked () {
        return this._data.unlockAt
            ? this._data.unlockAt > new Date
            : false;
    }

    getDuration () {
        return this._data.unlockAt - new Date;
    }

    getUnlockAt () {
        return this._data.unlockAt;
    }

    increment () {
        this._data.counter += 1;
        if (this.isExceeded()) {
            this.setUnlockAt();
        }
        return this.save();
    }

    reset () {
        this._data.counter = 0;
        this._data.unlockAt = null;
        return this.save();
    }

    block (timeout) {
        this.setUnlockAt(timeout);
        return this.save();
    }

    setUnlockAt (timeout = this.getTimeout()) {
        timeout = Date.now() + DateHelper.parseDuration(timeout);
        this._data.unlockAt = new Date(timeout);
    }

    async save () {
        this._data.updatedAt = new Date;
        this._data.createdAt = this._data.createdAt || this._data.updatedAt;
        await this.store.save(this);
        await this.rateLimit.afterRateUpdate(this);
    }

    getAttempts () {
        return this.rateLimit.getAttempts(this.type);
    }

    getTimeout () {
        return this.rateLimit.getTimeout(this.type);
    }

    setData (data) {
        Object.assign(this._data, data);
    }

    getData () {
        return this._data;
    }
};

const DateHelper = require('../../helper/DateHelper');