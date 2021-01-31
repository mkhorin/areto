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

    constructor (config) {
        super({
            active: true,
            startup: false, // start immediately
            startDate: null, // Date
            startTime: null, // 00:00:00
            period: 0, // repeat timeout (seconds or ISO_8601#Duration)
            repeats: 0, // 0 - endless
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
        let date = `${moment().format('YYYY-MM-DD')} ${this.startTime}`;
        if (!DateHelper.isValid(date)) {
            return this.log('error', `Invalid start time: ${date}`);
        }
        date = (new Date(date)).getTime();
        return date < Date.now() ? (date + this.DAY_PERIOD) : date;
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
        return this.trigger(this.EVENT_DONE, new Event({result}));
    }

    fail (error) {
        if (this.stopOnFail) {
            this._nextDate = null;
        }
        this._lastError = error;
        return this.trigger(this.EVENT_FAIL, new Event({error}));
    }

    log (type, message, data) {
        this.scheduler.log(type, `${this.constructor.name}: ${this.name}: ${message}`, data);
    }
};
module.exports.init();

const moment = require('moment');
const DateHelper = require('../helper/DateHelper');
const Event = require('../base/Event');