/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./QueryBuilder');

const CONDITION_BUILDERS = {
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
    'NOT EXISTS': 'buildNotExistsCondition',
};

const SIMPLE_OPERATORS = {
    '=': '$eq',
    '!=': '$ne',
    '>': '$gt',
    '>=': '$gte',
    '<': '$lt',
    '<=': '$lte'
};

module.exports = class MongoQueryBuilder extends Base {
    
    build (query) {
        query.cmd = {
            from: query._from,
            select: this.buildSelect(query._select),
            where: this.buildWhere(query._where),
            order: this.buildOrder(query._order)
        };
        if (query._offset) {
            query.cmd.offset = query._offset;
        }
        if (query._limit) {
            query.cmd.limit = query._limit;
        }
        query.afterBuild();
        //console.dir(query.cmd, { depth: 10 });
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

    // WHERE

    getFieldName (field) {
        if (typeof field !== 'string') {
            throw new Error(this.wrapClassMessage(`Invalid field name ${field}`));
        }
        return field;
    }

    buildWhere (condition) {
        return typeof condition === 'object' ? this.buildCondition(condition) : {};
    }

    buildCondition (condition) {
        if (condition instanceof Array) {
            // operator format: operator, operand 1, operand 2
            let operator = condition[0];
            return CONDITION_BUILDERS.hasOwnProperty(operator)
                ? this[CONDITION_BUILDERS[operator]](operator, condition.slice(1))
                : this.buildSimpleCondition(operator, condition.slice(1));
        }
        // hash format: {'column1': 'value1'}
        return this.buildHashCondition(condition);
    }

    buildHashCondition (condition) {
        if (condition) {
            for (let key of Object.keys(condition)) {
                if (condition[key] instanceof Array) {
                    condition[key] = {$in: condition[key]};
                }
            }
        }
        return condition;
    }

    buildSimpleCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('Simple requires 2 operands'));
        }
        if (!(SIMPLE_OPERATORS.hasOwnProperty(operator))) {
            throw new Error(this.wrapClassMessage(`Simple operator not found: ${operator}`));
        }        
        return {[this.getFieldName(operands[0])]: {[SIMPLE_OPERATORS[operator]]: operands[1]}};
    }

    buildLogicCondition (operator, operands) {
        let parts = [];
        if (operands instanceof Array) {
            for (let operand of operands) {
                parts.push(this.buildCondition(operand));
            }
        }
        return {[operator === 'AND' ? '$and' : operator === 'OR' ? '$or' : '$nor']: parts};
    }

    buildNotEqualCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT EQUAL requires 2 operands'));
        }
        return {[this.getFieldName(operands[0])]: {$ne: operands[1]}};
    }

    // IN

    buildInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('IN requires 2 operands'));
        }
        return {[this.getFieldName(operands[0])]:
                operands[1] instanceof Array ? {$in: operands[1]} : operands[1]};
    }

    buildNotInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT IN requires 2 operands'));
        }
        return {[this.getFieldName(operands[0])]:
                operands[1] instanceof Array ? {$nin: operands[1]} : {$ne: operands[1]}};
    }

    // LIKE

    buildLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('LIKE requires 2 operands'));
        }
        return {[this.getFieldName(operands[0])]: this.convertLikeToRegular(operands[1])};
    }

    convertLikeToRegular (value) {
        if (value instanceof RegExp) {
            return value;
        }
        value = CommonHelper.escapeRegExp(value);
        value = value.charAt(0) === '%' ? value.substring(1) : `^${value}`;
        value = value.charAt(value.length - 1) === '%' ?  value.substring(0, value.length - 1) : `${value}$`;
        return new RegExp(value, 'i');
    }

    buildNotLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT LIKE requires 2 operands'));
        }
        return {[this.getFieldName(operands[0])]: {$not: this.convertLikeToRegular(operands[1])}};
    }

    // BETWEEN

    buildBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error(this.wrapClassMessage('BETWEEN requires 3 operands'));
        }
        let field = this.getFieldName(operands[0]);
        // { $and: [ { field: { $gte: v1 } }, { field: { $lte: v1 } } ]}        
        return {$and: [{[field]: {$gte: operands[1]}}, {[field]: {$lte: operands[2]}}]};
    }

    buildNotBetweenCondition (operator, operands) {
        return {$not: this.buildBetweenCondition(operator, operands)};
    }

    // ID

    buildIdCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('ID requires 2 operands'));
        }
        let value = this.db.constructor.normalizeId(operands[1]);
        return {[operands[0]]: value instanceof Array ? {$in: value} : value};
    }

    buildNotIdCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT ID requires 2 operands'));
        }
        let value = this.db.constructor.normalizeId(operands[1]);
        return {[operands[0]]: value instanceof Array ? {$nin: value} : {$ne: value}};
    }

    // FALSE

    buildFalseCondition (operator, operands) {
        return {_id: false};
    }

    // NULL

    buildNullCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(this.wrapClassMessage('NULL requires 1 operand'));
        }
        return {[this.getFieldName(operands[0])]: {$type: 10}};
    }

    buildNotNullCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(this.wrapClassMessage('NOT NULL requires 1 operand'));
        }
        return {[this.getFieldName(operands[0])]: {$not: {$type: 10}}};
    }

    // EXISTS

    buildExistsCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(this.wrapClassMessage('EXISTS requires 1 operand'));
        }
        return {[this.getFieldName(operands[0])]: {$exists: true}};
    }

    buildNotExistsCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(this.wrapClassMessage('NOT EXISTS requires 1 operand'));
        }
        return {[this.getFieldName(operands[0])]: {$exists: false}};
    }
};

const mongodb = require('mongodb');
const CommonHelper = require('../helper/CommonHelper');