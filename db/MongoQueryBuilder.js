'use strict';

const Base = require('./QueryBuilder');

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
            order: this.buildOrder(query._orderBy)
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
            result[key] = order[key] == 1 ? 1 : -1;
        }
        return result;
    }

    // WHERE

    getFieldName (field) {
        if (typeof field !== 'string') {
            throw new Error(`${this.constructor.name}: Invalid field name ${field}`);
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
        // hash format: 'column1': 'value1', 'column2': 'value2'
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
            throw new Error(`${this.constructor.name}: Simple requires 2 operands.`);
        }
        if (!(SIMPLE_OPERATORS.hasOwnProperty(operator))) {
            throw new Error(`${this.constructor.name}: Simple operator not found.`);
        }        
        return {[this.getFieldName(operands[0])]: {[SIMPLE_OPERATORS[operator]]: operands[1]}};
    }

    buildAndCondition (operator, operands) {
        let parts = [];
        if (operands instanceof Array) {
            for (let operand of operands) {
                parts.push(this.buildCondition(operand));
            }
        }
        return {[operator === 'AND' ? '$and' : '$or']: parts};
    }

    buildNotEqualCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: NOT EQUAL requires 2 operands.`);
        }
        return {[this.getFieldName(operands[0])]: { $ne: operands[1] }};
    }

    // IN

    buildInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: IN requires 2 operands.`);
        }
        return {[this.getFieldName(operands[0])]: {$in: operands[1] instanceof Array ? operands[1] : [operands[1]]}};
    }

    buildNotInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: NOT IN requires 2 operands.`);
        };
        return {[this.getFieldName(operands[0])]: {$nin: operands[1] instanceof Array ? operands[1] : [operands[1]]}};
    }

    // LIKE

    buildLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: LIKE requires 2 operands.`);
        }
        return {[this.getFieldName(operands[0])]: this.convertLikeToRegular(operands[1])};
    }

    convertLikeToRegular (value) {
        if (value instanceof RegExp) {
            return value;
        }
        value = MainHelper.escapeRegExp(value);
        value = value.charAt(0) === '%' ? value.substring(1) : `^${value}`;
        value = value.charAt(value.length - 1) === '%' ?  value.substring(0, value.length - 1) : `${value}$`;
        return new RegExp(value, 'i');
    }

    buildNotLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: NOT LIKE requires 2 operands.`);
        }
        return {[this.getFieldName(operands[0])]: {$not: this.convertLikeToRegular(operands[1])}};
    }

    // BETWEEN

    buildBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error(`${this.constructor.name}: BETWEEN requires 3 operands.`);
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
            throw new Error(`${this.constructor.name}: ID requires 2 operands.`);
        }
        let value = this.db.normalizeId(operands[1]);
        if (value instanceof Array) {
            value = {$in: value};
        }    
        return {[operands[0]]: value};
    }

    // FALSE

    buildFalseCondition (operator, operands) {
        return {_id: false};
    }

    // NULL

    buildNullCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(`${this.constructor.name}: NULL requires 1 operand.`);
        }
        return {[this.getFieldName(operands[0])]: {$type: 10}};
    }

    buildNotNullCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(`${this.constructor.name}: NOT NULL requires 1 operand.`);
        }
        return {[this.getFieldName(operands[0])]: {$not: {$type: 10}}};
    }

    // EXISTS

    buildExistsCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(`MongoQueryBuilder: EXISTS requires 1 operand.`);
        }
        return {[this.getFieldName(operands[0])]: {$exists: true}};
    }

    buildNotExistsCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(`${this.constructor.name}: NOT EXISTS requires 1 operand.`);
        }
        return {[this.getFieldName(operands[0])]: {$exists: false}};
    }
};

const mongodb = require('mongodb');
const MainHelper = require('../helpers/MainHelper');