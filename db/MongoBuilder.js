/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MongoBuilder extends Base {

    static getConstants () {
        return {
            CONDITION_BUILDERS: {
                'AND': 'buildLogicCondition',
                'OR': 'buildLogicCondition',
                'NOR': 'buildLogicCondition',
                'EQUAL': 'buildEqualCondition',
                'NOT EQUAL': 'buildNotEqualCondition',
                'BETWEEN': 'buildBetweenCondition',
                'NOT BETWEEN':'buildNotBetweenCondition',
                'IN': 'buildInCondition',
                'NOT IN': 'buildNotInCondition',
                'LIKE': 'buildLikeCondition',
                'NOT LIKE': 'buildNotLikeCondition',
                'ID': 'buildIdCondition',
                'NOT ID': 'buildNotIdCondition',
                'FALSE': 'buildFalseCondition',
                'EMPTY': 'buildEmptyCondition',
                'NOT EMPTY': 'buildNotEmptyCondition',
                'NULL': 'buildNullCondition',
                'NOT NULL': 'buildNotNullCondition',
                'EXISTS': 'buildExistsCondition',
                'NOT EXISTS': 'buildNotExistsCondition'
            },
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
            return undefined;
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
            return this.buildHashCondition(data); // hash format: {column1: value1}
        }
        return this.CONDITION_BUILDERS.hasOwnProperty(data[0])
            ? this[this.CONDITION_BUILDERS[data[0]]](...data)
            : this.buildSimpleCondition(...data); // format: operator, operand 1, operand 2
    }

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

    buildSimpleCondition (operator, field, value) {
        if (!(this.SIMPLE_OPERATORS.hasOwnProperty(operator))) {
            throw new Error(`Invalid simple operator: ${operator}`);
        }        
        return {[this.normalizeField(field)]: {[this.SIMPLE_OPERATORS[operator]]: value}};
    }

    buildLogicCondition (operator, ...operands) {
        const items = [];
        for (const operand of operands) {
            items.push(this.buildCondition(operand));
        }
        operator = operator === 'AND' ? '$and' : operator === 'OR' ? '$or' : '$nor';
        return {[operator]: items};
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
        return {[this.normalizeField(field)]: Array.isArray(value) ? {$in: value} : value};
    }

    buildNotInCondition (operator, field, value) {
        value = Array.isArray(value) ? {$nin: value} : {$ne: value};
        return {[this.normalizeField(field)]: value};
    }

    // LIKE

    buildLikeCondition (operator, field, value) {
        return {[this.normalizeField(field)]: EscapeHelper.toRegex(value)};
    }

    buildNotLikeCondition (operator, field, value) {
        return {[this.normalizeField(field)]: {$not: EscapeHelper.toRegex(value)}};
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
        return {[this.normalizeField(field)]: Array.isArray(value) ? {$in: value} : value};
    }

    buildNotIdCondition (operator, field, value) {
        field = this.normalizeField(field);
        if (value === null) {
            return {$or: [{[field]: {$ne: null}}, {[field]: {$exists: false}}]};
        }
        value = this.db.constructor.normalizeId(value);
        return {[field]: Array.isArray(value) ? {$nin: value} : {$ne: value}};
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

const EscapeHelper = require('../helper/EscapeHelper');