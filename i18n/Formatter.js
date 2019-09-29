/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Formatter extends Base {

    static getConstants () {
        return {
            KiB: 1024,
            MiB: 1024 * 1024,
            GiB: 1024 * 1024 * 1024,
            TiB: 1024 * 1024 * 1024 * 1024,
        };
    }

    static getMethodName (type) {
        return `as${StringHelper.toFirstUpperCase(type)}`;
    }

    constructor (config) {
        super({
            language: config.i18n ? config.i18n.language : 'en',
            nullFormat: '<span class="not-set">[not set]</span>',
            booleanFormat: ['No', 'Yes'],
            byteFractionalPart: 100,
            dateFormat: 'L',
            dateLongFormat: 'LL',
            timeFormat: 'LT',
            timeLongFormat: 'LTS',
            datetimeFormat: 'LLL',
            timestampFormat: 'L LTS',
            ...config
        });
    }

    format (value, type, params) {
        if (!type) {
            return this.asRaw(value, params);
        }
        const name = this.constructor.getMethodName(type);
        if (typeof this[name] === 'function') {
            return this[name](value, params);
        }
        this.log('error', `Unknown type: ${type}`);
        return this.asRaw(value, params);
    }

    translate (message, source, language) {
        return this.i18n
            ? this.i18n.translate(message, source, null, language || this.language)
            : message;
    }

    asRaw (value, params = {}) {
        return value === null || value === undefined
            ? this.translate(this.nullFormat, I18n.CORE_SOURCE, params.language)
            : value;
    }

    asBoolean (value, params = {}) {
        if (value === null || value === undefined) {
            return this.translate(this.nullFormat, I18n.CORE_SOURCE, params.language);
        }
        value = this.booleanFormat[value ? 1 : 0];
        return this.translate(value, I18n.CORE_SOURCE, params.language);
    }

    asBytes (value, params = {}) {
        if (value === null || value === undefined) {
            return this.translate(this.nullFormat, I18n.CORE_SOURCE, params.language);
        }
        let unit;
        if (value < this.KiB) {
            unit = 'B';
        } else if (value < this.MiB) {
            unit = 'KiB';
            value /= this.KiB;
        } else if (value < this.GiB) {
            unit = 'MiB';
            value /= this.MiB;
        } else if (value < this.TiB) {
            unit = 'GiB';
            value /= this.GiB;
        } else {
            unit = 'TiB';
            value /= this.TiB;
        }
        value = Math.round(value * this.byteFractionalPart) / this.byteFractionalPart;
        unit = this.translate(unit, I18n.CORE_SOURCE, params.language);
        return `${value} ${unit}`;
    }

    asUrl (value, params = {}) {
        return value
            ? `<a href="${value}" class="${params.css || ''}" target="${params.target || ''}">${params.text || value}</a>`
            : this.asRaw(value, params);
    }

    // DATE

    asDate (value, params = {}) {
        return value
            ? moment(value).locale(params.language || this.language).format(params.format || this.dateFormat)
            : this.asRaw(value, params);
    }

    asDateLong (value, params) {
        return this.asDate(value, {format: this.dateLongFormat, ...params});
    }

    asDuration (value, params = {}) {
        return value || value === 0
            ? moment.duration(value, params.units).locale(params.language || this.language).humanize(params.suffix)
            : this.asRaw(value, params);
    }

    asTime (value, params) {
        return this.asDate(value, {format: this.timeFormat, ...params});
    }

    asTimeLong (value, params) {
        return this.asDate(value, {format: this.timeLongFormat, ...params});
    }

    asDatetime (value, params) {
        return this.asDate(value, {format: this.datetimeFormat, ...params});
    }

    asTimestamp (value, params) {
        return this.asDate(value, {format: this.timestampFormat, ...params});
    }

    asFromNow (value, params = {}) {
        return value
            ? moment(value).locale(params.language || this.language).fromNow()
            : this.asRaw(value, params);
    }

    asToNow (value, params = {}) {
        return value
            ? moment(value).locale(params.language || this.language).toNow()
            : this.asRaw(value, params);
    }

    asFromDate (value, params = {}) {
        return value && params.date
            ? moment(value).locale(params.language || this.language).from(params.date)
            : this.asRaw(value, params);
    }

    asToDate (value, params = {}) {
        return value && params.date
            ? moment(value).locale(params.language || this.language).to(params.date)
            : this.asRaw(value, params);
    }

    asIso (value, params) {
        return value ? moment(value).toISOString() : this.asRaw(value, params);
    }

    asClientDate (value, params = {}) {
        if (!value) {
            return this.asRaw(value, params);
        }
        value = value instanceof Date ? value.toISOString() : moment(value).toISOString();
        return `<time datetime="${value}" data-format="${params.format || ''}" data-utc="${params.utc || ''}">${value}</time>`;
    }
};
module.exports.init();

const moment = require('moment');
const I18n = require('./I18n');
const StringHelper = require('../helper/StringHelper');