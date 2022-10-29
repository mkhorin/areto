/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Builder');

module.exports = class MongoBuilder extends Base {

    static getConstants () {
        return {
            SIMPLE_OPERATORS: {
                '=': '$eq',
                '!=': '$ne',
                '>': '$gt',
                '>=': '$gte',
                '<': '$lt',
                '<=': '$lte'
            }
        };
    }

    normalizeField (field) {
        if (typeof field !== 'string') {
            throw new Error(`Invalid field: ${field}`);
        }
        return field;
    }

    build (query) {
        query.cmd = {
            from: query._from
        };
        const select = this.buildSelect(query._select);
        if (select) {
            query.cmd.select = select;
        }
        const where = this.buildWhere(query._where);
        if (where) {
            query.cmd.where = where;
        }
        const order = this.buildOrder(query._order);
        if (order) {
            query.cmd.order = order;
        }
        if (query._offset) {
            query.cmd.offset = query._offset;
        }
        if (query._limit) {
            query.cmd.limit = query._limit;
        }
        query.afterBuild();
        return query.cmd;
    }

    buildSelect (select) {
        return select;
    }

    buildOrder (order) {
        if (!order) {
            return;
        }
        const result = {};
        for (const key of Object.keys(order)) {
            result[key] = order[key] === 1 ? 1 : -1;
        }
        return result;
    }

    buildWhere (condition) {
        return condition ? this.buildCondition(condition) : {};
    }

    buildCondition (data) {
        if (!Array.isArray(data)) {
            return this.buildHashCondition(data);
        }
        return this.CONDITION_METHODS.hasOwnProperty(data[0])
            ? this[this.CONDITION_METHODS[data[0]]](...data)
            : this.buildSimpleCondition(...data);
    }

    /**
     * @param {Object} data - hash format {column1: value1}
     */
    buildHashCondition (data) {
        if (data) {
            for (const key of Object.keys(data)) {
                if (Array.isArray(data[key]) && data[key].length) {
                    data[key] = {$in: data[key]};
                }
            }
        }
        return data;
    }

    /**
     * @param {string} operator
     * @param {string} field - operand 1
     * @param value - operand 2
     */
    buildSimpleCondition (operator, field, value) {
        if (!(this.SIMPLE_OPERATORS.hasOwnProperty(operator))) {
            throw new Error(`Invalid simple operator: ${operator}`);
        }
        value = {[this.SIMPLE_OPERATORS[operator]]: value};
        return {[this.normalizeField(field)]: value};
    }

    // LOGIC

    buildAndCondition (operator, ...operands) {
        return {$and: operands.map(this.buildCondition, this)};
    }

    buildOrCondition (operator, ...operands) {
        return {$or: operands.map(this.buildCondition, this)};
    }

    buildNotCondition (operator, ...operands) {
        return {$nor: operands.map(this.buildCondition, this)};
    }

    // EQUAL

    buildEqualCondition (operator, field, value) {
        return {[this.normalizeField(field)]: value};
    }

    buildNotEqualCondition (operator, field, value) {
        return {[this.normalizeField(field)]: {$ne: value}};
    }

    // IN

    buildInCondition (operator, field, value) {
        value = Array.isArray(value) ? {$in: value} : value;
        return {[this.normalizeField(field)]: value};
    }

    buildNotInCondition (operator, field, value) {
        value = Array.isArray(value) ? {$nin: value} : {$ne: value};
        return {[this.normalizeField(field)]: value};
    }

    // LIKE

    buildLikeCondition (operator, field, value) {
        value = MongoHelper.convertToRegex(value);
        return {[this.normalizeField(field)]: value};
    }

    buildNotLikeCondition (operator, field, value) {
        value = {$not: MongoHelper.convertToRegex(value)};
        return {[this.normalizeField(field)]: value};
    }

    // BETWEEN

    buildBetweenCondition (operator, field, min, max) {
        field = this.normalizeField(field);
        return {$and: [{[field]: {$gte: min}}, {[field]: {$lte: max}}]};
    }

    buildNotBetweenCondition () {
        return {$not: this.buildBetweenCondition(...arguments)};
    }

    // ID

    buildIdCondition (operator, field, value) {
        value = this.db.constructor.normalizeId(value);
        value = Array.isArray(value) ? {$in: value} : value;
        return {[this.normalizeField(field)]: value};
    }

    buildNotIdCondition (operator, field, value) {
        field = this.normalizeField(field);
        if (value === null) {
            return {$or: [{[field]: {$ne: null}}, {[field]: {$exists: false}}]};
        }
        value = this.db.constructor.normalizeId(value);
        value = Array.isArray(value) ? {$nin: value} : {$ne: value};
        return {[field]: value};
    }

    // FALSE

    buildFalseCondition () {
        return {_id: false};
    }

    // EMPTY (check - null, undefined, [], '')

    buildEmptyCondition (operator, field) {
        return {[this.normalizeField(field)]: {$in: [null, '', []]}};
    }

    buildNotEmptyCondition (operator, field) {
        return {[this.normalizeField(field)]: {$nin: [null, '', []]}};
    }

    // NULL (check only null value)

    buildNullCondition (operator, field) {
        return {[this.normalizeField(field)]: {$type: 10}};
    }

    buildNotNullCondition (operator, field) {
        return {[this.normalizeField(field)]: {$not: {$type: 10}}};
    }

    // EXISTS (check only undefined value)

    buildExistsCondition (operator, field) {
        return {[this.normalizeField(field)]: {$exists: true}};
    }

    buildNotExistsCondition (operator, field) {
        return {[this.normalizeField(field)]: {$exists: false}};
    }
};
module.exports.init();

const MongoHelper = require('../helper/MongoHelper');