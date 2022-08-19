/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Validator');

module.exports = class DateValidator extends Base {

    /**
     * @param {Object} config
     * @param {Date) config.min - Minimum date
     * @param {Date) config.max - Maximum date
     * @param {Array) config.minExpression - Calculate date: [[method, ...arguments], ...]
     * [] - today
     * ['add', 1, 'years'] - Add 1 year to today
     * ['subtract', 5, 'months'] - Subtract 5 months from today
     * [['subtract', 3, 'days'], ['startOf', 'month']] - Subtract 3 days from today and get the the month start
     * ['endOf', 'week'] - Get the end of the current week
     * @param {Array) config.maxExpression - Calculate date
     * @param {string) config.format - Format: date | datetime | timestamp
     */
    constructor (config) {
        super({
            min: null,
            max: null,
            minExpression: null,
            maxExpression: null,
            format: 'date',
            ...config
        });
        this.min = this.resolveDate(this.min, this.minExpression);
        this.max = this.resolveDate(this.max, this.maxExpression);
    }

    resolveDate (date, expression) {
        let result = null;
        if (date) {
            result = this.resolveStaticDate(date);
        }
        if (expression) {
            result = this.resolveDynamicDate(expression);
        }
        if (result && this.format === 'date') {
            result.setHours(0, 0, 0, 0);
        }
        return result;
    }

    resolveStaticDate (date) {
        const result = date instanceof Date ? date : new Date(date);
        if (DateHelper.isValid(result)) {
            return result;
        }
        throw new Error(`Invalid date: ${date}`);
    }

    resolveDynamicDate (data) {
        if (!Array.isArray(data)) {
            throw new Error(`Invalid expression: ${data}`);
        }
        if (!data.length) {
            return new Date;
        }
        if (!Array.isArray(data[0])) {
            data = [data];
        }
        let date = moment();
        for (let [method, ...args] of data) {
            date = date[method](...args);
        }
        return date.toDate();
    }

    getMessage () {
        return this.createMessage(this.message, 'Invalid date');
    }

    getTooSmallMessage () {
        return this.createMessage(this.tooSmall, 'Date must be no less than {min}', {
            min: [this.min, this.format]
        });
    }

    getTooBigMessage () {
        return this.createMessage(this.tooBig, 'Date must be no greater than {max}', {
            max: [this.max, this.format]
        });
    }

    validateAttr (attr, model) {
        let value = model.get(attr);
        value = value instanceof Date ? value : new Date(value);
        model.set(attr, value);
        return super.validateAttr(...arguments);
    }

    validateValue (value) {
        if (!DateHelper.isValid(value)) {
            return this.getMessage();
        }
        if (this.min && value < this.min) {
            return this.getTooSmallMessage();
        }
        if (this.max && value > this.max) {
            return this.getTooBigMessage();
        }
    }
};

const DateHelper = require('areto/helper/DateHelper');