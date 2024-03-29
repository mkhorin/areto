/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Task extends Base {

    static getConstants () {
        return {
            EVENT_BEFORE_EXECUTE: 'beforeExecute',
            EVENT_DONE: 'done',
            EVENT_FAIL: 'fail',
            DAY_PERIOD: 24 * 3600 * 1000
        };
    }

    /**
     * @param {Object} config
     * @param {boolean} config.startup - Start immediately
     * @param {Object} config.startDate - Date instance
     * @param {string} config.startTime - Time format: 00:00:00
     * @param {number} config.period - Repeat timeout (in seconds or ISO_8601#Duration)
     * @param {number} config.repeats - Zero is endless
     */
    constructor (config) {
        super({
            active: true,
            startup: false,
            startDate: null,
            startTime: null,
            period: 0,
            repeats: 0,
            stopOnFail: true,
            ...config
        });
        if (this.startup) {
            this.startDate = new Date;
        }
        this.period = DateHelper.parseDuration(this.period);
        this._counter = 0;
    }

    init () {
        if (this.active) {
            this.start();
        }
    }

    stop () {
        this._nextDate = null;
        this.cancelJob();
    }

    start () {
        this.stop();
        if (this.isInProgress()) {
            return this.fail('Start skipped. Task is already in progress');
        }
        this._counter = 0;
        this._lastStartDate = null;
        this._lastEndtDate = null;
        this._lastError = null;
        this.setNextDate(this.startDate || this.getPeriodTime());
        return true;
    }

    isActive () {
        return this.active;
    }

    isInProgress () {
        return !!this._job;
    }

    canRepeat () {
        return this.repeats === 0 || this._counter < this.repeats;
    }

    getLastError () {
        return this._lastError;
    }

    getLastStartDate () {
        return this._lastStartDate;
    }

    getLastEndDate () {
        return this._lastEndDate;
    }

    getNextDate () {
        return this._nextDate;
    }

    setNextDate (date) {
        if (!date) {
            return this._nextDate = null;
        }
        if (DateHelper.isValid(date)) {
            return this._nextDate = new Date(date);
        }
        this.log('error', `Invalid next date: ${date}`);
        return this._nextDate = null;
    }

    getPeriodTime () {
        if (this.canRepeat()) {
            if (this.startTime) {
                return this.formatStartTime();
            }
            if (this.period) {
                return Date.now() + this.period;
            }
        }
    }

    formatStartTime () {
        const date = `${moment().format('YYYY-MM-DD')} ${this.startTime}`;
        if (!DateHelper.isValid(date)) {
            return this.log('error', `Invalid start time: ${date}`);
        }
        const time = (new Date(date)).getTime();
        return time < Date.now()
            ? time + this.DAY_PERIOD
            : time;
    }

    refresh () {
        if (this._nextDate && Date.now() >= this._nextDate) {
            this.setNextDate(this.getPeriodTime());
            if (this.active) {
                return this.execute();
            }
        }
    }

    async execute (data) {
        if (this.isInProgress()) {
            return this.fail('Job not started. Previous one in progress');
        }
        try {
            this._job = this.createJob();
            await this.beforeExecute();
            this.processInternal(data); // not await
        } catch (err) {
            this._job = null;
            return this.fail(err);
        }
    }

    createJob () {
        return this.spawn(this.job, {task: this});
    }

    cancelJob () {
        if (!this.isInProgress()) {
            return false;
        }
        try {
            this._job.cancel();
        } catch (err) {
            return this.fail(err);
        }
    }

    async processInternal (data) {
        if (!this.isInProgress()) {
            return false;
        }
        try {
            this.log('info', `Job started: ${this._job.constructor.name}`);
            this._lastStartDate = new Date;
            const result = await this._job.start(data);
            if (this._job.isCanceled()) {
                await this.fail('Job canceled');
            } else {
                this._counter += 1;
                this._lastEndDate = new Date;
                await this.done(result);
            }
        } catch (err) {
            try {
                await this.fail(err);
            } catch (err) {
                this.log('error', 'Failed', err);
            }
        }
        this._job = null;
    }

    beforeExecute () {
        return this.trigger(this.EVENT_BEFORE_EXECUTE);
    }

    done (result) {
        const event = new Event({result});
        return this.trigger(this.EVENT_DONE, event);
    }

    fail (error) {
        if (this.stopOnFail) {
            this._nextDate = null;
        }
        this._lastError = error;
        const event = new Event({error});
        return this.trigger(this.EVENT_FAIL, event);
    }

    log (type, message, data) {
        message = `${this.constructor.name}: ${this.name}: ${message}`;
        this.scheduler.log(type, message, data);
    }
};
module.exports.init();

const DateHelper = require('../helper/DateHelper');
const Event = require('../base/Event');
const moment = require('moment');