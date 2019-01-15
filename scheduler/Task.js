/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Task extends Base {

    static getConstants () {
        return {
            EVENT_BEFORE_RUN: 'beforeRun',
            EVENT_DONE: 'done',
            EVENT_FAIL: 'fail',
            DAY_PERIOD: 24 * 3600 * 1000
        };
    }

    constructor (config) {
        super({
            'active': true,
            'startDate': null, // new Date
            'startTime': null, // 00:00:00
            'period': 0, // seconds
            'repeats': 0, // 0 - endless
            'stopOnFail': true,
            ...config
        });
        this._counter = 0;
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
        if (this.isRunning()) {
            return this.fail('Skip task start. Job in progress');
        }
        this._counter = 0;
        this._lastStartDate = null;
        this._lastEndtDate = null;
        this._lastError = null;
        this.setNextDate(this.startDate || this.getPeriodTime());
        return true;
    }

    isRunning () {
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
        if (CommonHelper.isValidDate(date)) {
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
                return Date.now() + this.period * 1000;
            }
        }
    }

    formatStartTime () {
        let date = `${moment().format('YYYY-MM-DD')} ${this.startTime}`;
        if (!CommonHelper.isValidDate(date)) {
            return this.log('error', `Invalid start time: ${date}`);
        }
        date = (new Date(date)).getTime();
        return date < Date.now() ? (date + this.DAY_PERIOD) : date;
    }

    refresh () {
        if (this._nextDate && Date.now() > this._nextDate) {
            this.setNextDate(this.getPeriodTime());
            if (this.active) {
                this.execute();
            }
        }
    }

    async execute () {
        if (this.isRunning()) {
            return this.fail('Job does not start. Previous one in progress');
        }
        try {
            this._job = this.createJob();
            await this.beforeRun();
            this.processInternal();
        } catch (error) {
            this._job = null;
            this.fail(error);
        }
    }

    createJob () {
        return ClassHelper.createInstance(this.job);
    }

    cancelJob () {
        if (!this.isRunning()) {
            return false;
        }
        try {
            this._job.cancel();
        } catch (error) {
            this.fail(error);
        }
    }

    async processInternal () {
        if (!this.isRunning()) {
            return false;
        }
        try {
            this.log('info', `Job start: ${this._job.CLASS_FILE}`);
            this._lastStartDate = new Date;
            let result = await this._job.execute();
            if (this._job.isCanceled()) {
                this.fail('Job canceled');
            } else {
                this._counter += 1;
                this._lastEndDate = new Date;
                this.done(result);    
            }
        } catch (err) {
            this.fail(err);
        }
        this._job = null;
    }

    beforeRun () {
        return this.trigger(this.EVENT_BEFORE_RUN);
    }

    done (result) {
        this.trigger(this.EVENT_DONE, new Event({result}));
    }

    fail (error) {
        if (this.stopOnFail) {
            this._nextDate = null;
        }
        this._lastError = error;
        this.trigger(this.EVENT_FAIL, new Event({error}));
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.scheduler);
    }
};
module.exports.init();

const moment = require('moment');
const CommonHelper = require('../helper/CommonHelper');
const ClassHelper = require('../helper/ClassHelper');
const Event = require('../base/Event');