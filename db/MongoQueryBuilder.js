'use strict';

const Base = require('./QueryBuilder');
const mongodb = require('mongodb');
const helper = require('../helpers/MainHelper');

const CONDITION_BUILDERS = {
    'AND': 'buildAndCondition',
    'OR': 'buildAndCondition',
    'NOT EQUAL': 'buildNotEqualCondition',
    'BETWEEN': 'buildBetweenCondition',
    'NOT BETWEEN':'buildNotBetweenCondition',
    'IN': 'buildInCondition',
    'NOT IN': 'buildNotInCondition',
    'LIKE': 'buildLikeCondition',
    'NOT LIKE': 'buildNotLikeCondition',
    'ID': 'buildIdCondition',
    'FALSE': 'buildFalseCondition'
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
            order: this.buildOrder(query._orderBy),
            offset: query._offset,
            limit: query._limit,
        };
        query.afterBuild();
        //console.dir(query.cmd, { depth: 10 });
        return query.cmd;
    }

    buildSelect (select) {
        return select;
    }

    buildOrder (order) {
        if (!order) {
            return order;
        }
        let result = {};
        for (let key in order) {
            result[key] = order[key].toUpperCase() === 'DESC' ? -1 : 1;
        }
        return result;
    }

    // WHERE

    getFieldName (field) {
        if (typeof field !== 'string') {
            throw new Error(`MongoQueryBuilder: Invalid field name ${field}`);
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
            return operator in CONDITION_BUILDERS
                ? this[CONDITION_BUILDERS[operator]](operator, condition.slice(1))
                : this.buildSimpleCondition(operator, condition.slice(1));
        }
        // hash format: 'column1': 'value1', 'column2': 'value2'
        return this.buildHashCondition(condition);
    }

    buildHashCondition (condition) {
        for (let key in condition) {
            if (condition[key] instanceof Array) {
                condition[key] = {$in: condition[key]};
            }
        }
        return condition;
    }

    buildSimpleCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MongoQueryBuilder: Simple requires 2 operands.');
        }
        if (!(operator in SIMPLE_OPERATORS)) {
            throw new Error('MongoQueryBuilder: Simple operator not found.');
        }        
        return {[this.getFieldName(operands[0])]: {[SIMPLE_OPERATORS[operator]]: operands[1]}};
    }

    buildAndCondition (operator, operands) {
        let parts = [];
        for (let operand of operands) {
            parts.push(this.buildCondition(operand));
        }
        return {[operator === 'AND' ? '$and' : '$or']: parts};
    }

    buildNotEqualCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MongoQueryBuilder: NOT EQUAL requires 2 operands.');
        }
        return {[this.getFieldName(operands[0])]: { $ne: operands[1] }};
    }

    // IN

    buildInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MongoQueryBuilder: IN requires 2 operands.');
        }
        return {[this.getFieldName(operands[0])]: {$in: operands[1] instanceof Array ? operands[1] : [operands[1]]}};
    }

    buildNotInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MongoQueryBuilder: NOT IN requires 2 operands.');
        };
        return {[this.getFieldName(operands[0])]: {$nin: operands[1] instanceof Array ? operands[1] : [operands[1]]}};
    }

    // LIKE

    buildLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MongoQueryBuilder: LIKE requires 2 operands.');
        }
        return {[this.getFieldName(operands[0])]: this.convertLikeToRegular(operands[1])};
    }

    convertLikeToRegular (value) {
        if (value instanceof RegExp) {
            return value;
        }
        value = helper.escapeRegExp(value);
        value = value.charAt(0) === '%' ? value.substring(1) : `^${value}`;
        value = value.charAt(value.length - 1) === '%' ?  value.substring(0, value.length - 1) : `${value}$`;
        return new RegExp(value, 'i');
    }

    buildNotLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MongoQueryBuilder: NOT LIKE requires 2 operands.');
        }
        return {[this.getFieldName(operands[0])]: {$not: this.convertLikeToRegular(operands[1])}};
    }

    // BETWEEN

    buildBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error('MongoQueryBuilder: BETWEEN requires 3 operands.');
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
            throw new Error('MongoQueryBuilder: ID requires 2 operands.');
        }
        let value = this.db.wrapId(operands[1]);
        if (value instanceof Array) {
            value = {$in: value};
        }    
        return {[operands[0]]: value};
    }

    buildFalseCondition (operator, operands) {
        return {_id: false};
    }
};