/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MongoQueryBuilder extends Base {

    static getConstants () {
        return {
            CONDITION_BUILDERS: {
                'AND': 'buildLogicCondition',
                'OR': 'buildLogicCondition',
                'NOR': 'buildLogicCondition',
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
            throw new Error(this.wrapClassMessage(`Invalid field: ${field}`));
        }
        return field;
    }

    build (query) {
        query.cmd = {
            from: query._from
        };
        let select = this.buildSelect(query._select);
        if (select) {
            query.cmd.select = select;
        }
        let where = this.buildWhere(query._where);
        if (where) {
            query.cmd.where = where;
        }
        let order = this.buildOrder(query._order);
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
        let result = {};
        for (let key of Object.keys(order)) {
            result[key] = order[key] === 1 ? 1 : -1;
        }
        return result;
    }

    buildWhere (condition) {
        return typeof condition === 'object' ? this.buildCondition(condition) : {};
    }

    buildCondition (data) {
        if (!Array.isArray(data)) {
            // hash format: {column1: value1}
            return this.buildHashCondition(data);
        }
        // format: operator, operand 1, operand 2
        return this.CONDITION_BUILDERS.hasOwnProperty(data[0])
            ? this[this.CONDITION_BUILDERS[data[0]]](...data)
            : this.buildSimpleCondition(...data);
    }

    buildHashCondition (data) {
        if (data) {
            for (let key of Object.keys(data)) {
                if (Array.isArray(data[key])) {
                    data[key] = {$in: data[key]};
                }
            }
        }
        return data;
    }

    buildSimpleCondition (operator, field, value) {
        if (!(this.SIMPLE_OPERATORS.hasOwnProperty(operator))) {
            throw new Error(this.wrapClassMessage(`Invalid simple operator: ${operator}`));
        }        
        return {[this.normalizeField(field)]: {[this.SIMPLE_OPERATORS[operator]]: value}};
    }

    buildLogicCondition (operator, ...operands) {
        let items = [];
        for (let operand of operands) {
            items.push(this.buildCondition(operand));
        }
        operator = operator === 'AND' ? '$and' : operator === 'OR' ? '$or' : '$nor';
        return {[operator]: items};
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
        return {[this.normalizeField(field)]: this.convertLikeToRegular(value)};
    }

    buildNotLikeCondition (operator, field, value) {
        return {[this.normalizeField(field)]: {$not: this.convertLikeToRegular(value)}};
    }

    convertLikeToRegular (value) {
        if (value instanceof RegExp) {
            return value;
        }
        value = EscapeHelper.escapeRegExp(value);
        value = value.charAt(0) === '%' ? value.substring(1) : `^${value}`;
        value = value.charAt(value.length - 1) === '%' ?  value.substring(0, value.length - 1) : `${value}$`;
        return new RegExp(value, 'i');
    }

    // BETWEEN

    buildBetweenCondition (operator, field, min, max) {
        field = this.normalizeField(field);
        return {$and: [{[field]: {$gte: min}}, {[field]: {$lte: max}}]};
    }

    buildNotBetweenCondition (...args) {
        return {$not: this.buildBetweenCondition(...args)};
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

    // NULL (check only null NOT undefined value)

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