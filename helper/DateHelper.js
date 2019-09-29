/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class DateHelper {

    static isExpired (date, period, now = new Date) {
        return date.valueOf() + this.parseDuration(period) < now.valueOf();
    }

    static isValid (date) {
        if (!date) {
            return false;
        }
        date = date instanceof Date ? date : new Date(date);
        return !isNaN(date.getTime());
    }

    static getValid (date) {
        if (!date) {
            return null;
        }
        date = date instanceof Date ? date : new Date(date);
        return isNaN(date.getTime()) ? null : date;
    }

    static getAbsolute (date) {
        if (!date) {
            return null;
        }
        date = date instanceof Date ? date : new Date(date);
        const time = date.getTime();
        return isNaN(time) ? null : (new Date(time + date.getTimezoneOffset() * 60000));
    }

    static parseDuration (value) {
        return typeof value === 'number'
            ? value * 1000
            : moment.duration(value).valueOf();
    }
};

const moment = require('moment');