'use strict';

const Base = require('../base/Base');

module.exports = class Formatter extends Base {

    static getConstants () {
        return {
            KiB: 1024,
            MiB: 1024 * 1024,
            GiB: 1024 * 1024 * 1024,
            TiB: 1024 * 1024 * 1024 * 1024,
        };
    }

    constructor (config) {
        super(Object.assign({
            language: config.i18n ? config.i18n.language : 'en',
            nullFormat: '<span class="not-set">[not set]</span>',
            booleanFormat: ['No', 'Yes'],
            byteFractionalPart: 100,
            dateFormat: 'L',
            dateLongFormat: 'LL',
            timeFormat: 'LT',
            timeLongFormat: 'LTS',
            datetimeFormat: 'LLL',
            timestampFormat: 'L LTS'
        }, config));
    }

    format (value, type, params) {
        let methodName = this.getMethodName(type);
        if (typeof this[methodName] === 'function') {
            return this[methodName](value, params);
        }
        this.module.log('error', `${this.constructor.name}: Unknown type '${type}' for value '${value}'`);
        return value;
    }

    getMethodName (type) {
        return `as${StringHelper.toFirstUpperCase(type)}`;
    }

    asRaw (value, params = {}) {
        return value === undefined ? '' : value === null ? this.nullFormat : value;
    }

    asBoolean (value, params = {}) {
        if (value === null || value === undefined) {
            return this.nullFormat;
        }
        return this.translate(this.booleanFormat[value ? 1 : 0], params.language);
    }

    asBytes (value, params = {}) {
        if (value === null || value === undefined) {
            return this.nullFormat;
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
        unit = this.translate(unit, params.language);
        return `${value} ${unit}`;
    }

    // DATE

    asDuration (value, params = {}) {
        return value ? moment.duration(value, params.units).locale(params.language || this.language).humanize()
            : this.asRaw(value, params);
    }

    asDate (value, params = {}) {
        return value ? moment(value).locale(params.language || this.language).format(params.format || this.dateFormat)
            : this.asRaw(value, params);
    }

    asDateLong (value, params) {
        return this.asDate(value, Object.assign({
            format: this.dateLongFormat
        }, params));
    }

    asTime (value, params) {
        return this.asDate(value, Object.assign({
            format: this.timeFormat
        }, params));
    }

    asTimeLong (value, params) {
        return this.asDate(value, Object.assign({
            format: this.timeLongFormat
        }, params));
    }

    asDatetime (value, params) {
        return this.asDate(value, Object.assign({
            format: this.datetimeFormat
        }, params));
    }

    asTimestamp (value, params) {
        return this.asDate(value, Object.assign({
            format: this.timestampFormat
        }, params));
    }

    asFromNow (value, params = {}) {
        return value ? moment(value).locale(params.language || this.language).fromNow()
            : this.asRaw(value, params);
    }

    asToNow (value, params = {}) {
        return value ? moment(value).locale(params.language || this.language).toNow()
            : this.asRaw(value, params);
    }

    asFromDate (value, params = {}) {
        return value && params.date ? moment(value).locale(params.language || this.language).from(params.date)
            : this.asRaw(value, params);
    }

    asToDate (value, params = {}) {
        return value && params.date ? moment(value).locale(params.language || this.language).to(params.date)
            : this.asRaw(value, params);
    }

    asIso (value, params) {
        return value ? moment(value).toISOString()
            : this.asRaw(value, params);
    }

    // TRANSLATE

    translate (msg, language) {
        return this.i18n ? this.i18n.translate('areto', msg, null, language || this.language) : msg;
    }
};
module.exports.init();

const moment = require('moment');
const StringHelper = require('../helpers/StringHelper');