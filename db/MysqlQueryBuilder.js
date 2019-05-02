/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./QueryBuilder');

const CONDITION_BUILDERS = {
    'AND': 'buildLogicCondition',
    'OR': 'buildLogicCondition',
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
    'NOT NULL': 'buildNotNullCondition'
};

const SIMPLE_OPERATORS = {
    '=': ' = ',
    '!=': ' != ',
    '>': ' > ',
    '>=': ' >= ',
    '<': ' < ',
    '<=': ' <= '
};

module.exports = class MysqlQueryBuilder extends Base {

    build (query) {
        query.cmd = {
            'from': this.db.escapeId(query._from),
            'select': this.buildSelect(query._select),
            'where': this.buildWhere(query._where),
            'order': this.buildOrder(query._order),
            'offset': query._offset,
            'limit': query._limit,
        };
        query.afterBuild();
        return query.cmd;
    }

    buildSelect (select) {
        return select ? this.db.escapeId(select) : '*';
    }

    buildOrder (order) {
        if (!order) {
            return null;
        }
        let result = [];
        for (let key of Object.keys(order)) {
            result.push(`${this.db.escapeId(key)} ${order[key] === 1 ? 'ASC' : 'DESC'}`);
        }
        return result.length ? result.join(',') : null;
    }

    stringify (cmd) {
        let sql = `SELECT ${cmd.select} FROM ${cmd.from}`;
        if (cmd.where) {
            sql += cmd.where;
        }
        if (cmd.order) {
            sql +=` ORDER BY ${cmd.order}`;
        } 
        if (cmd.offset) {
            sql +=` LIMIT ${cmd.offset},${cmd.limit ? cmd.limit : 9999999999}`;
        } else if (cmd.limit) {
            sql +=` LIMIT ${cmd.limit}`;
        }
        return sql;
    }
    
    // WHERE

    getFieldName (field) {
        if (typeof field !== 'string') {
            throw new Error(this.wrapClassMessage('Invalid field name'));
        }
        return this.db.escapeId(field);
    }

    buildWhere (condition) {
        return  condition
            ? (' WHERE '+ (typeof condition === 'object' ? this.buildCondition(condition) : condition))
            : '';
    }

    buildCondition (condition) {
        if (!Array.isArray(condition)) {
            return this.buildHashCondition(condition);    
        }
        let operator = condition[0];
        return Object.prototype.hasOwnProperty.call(CONDITION_BUILDERS, operator)
            ? this[CONDITION_BUILDERS[operator]](condition.slice(1), operator)
            : this.buildSimpleCondition(condition.slice(1), operator);
    }

    buildHashCondition (condition) {        
        if (!condition) {
            return '';
        }
        let result = [];
        for (let key of Object.keys(condition)) {
            let field = this.getFieldName(key);
            if (Array.isArray(condition[key])) {
                result.push(`field IN (${this.db.escape(condition[key])})`);
            } else if (condition[key] === null) {
                result.push(`${field} IS NULL`);
            } else {
                result.push(`${field}=${this.db.escape(condition[key])}`);
            }
        }
        return result.join(' AND ');
    }

    buildSimpleCondition (operands, operator) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('Simple requires 2 operands'));
        }
        if (!Object.prototype.hasOwnProperty.call(SIMPLE_OPERATORS, operator)) {
            throw new Error(this.wrapClassMessage('Simple operator not found'));
        }
        let field = this.getFieldName(operands[0]);
        return operands[1] === null
            ? field + (operator === '=' ? ' IS NULL' : ' IS NOT NULL')
            : field + SIMPLE_OPERATORS[operator] + this.db.escape(operands[1]);
    }

    buildLogicCondition (operands, operator) {
        let parts = [];
        if (Array.isArray(operands)) {
            for (let operand of operands) {
                parts.push(this.buildCondition(operand));
            }
        }
        return '('+ parts.join(operator === 'AND' ? ') AND (' : ') OR (') +')';
    }

    buildNotEqualCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT EQUAL requires 2 operands'));
        }
        return Array.isArray(operands[1]) 
            ? this.buildNotInCondition() 
            : `${this.getFieldName(operands[0])}!=${this.db.escape(operands[1])}`;
    }

    // IN

    buildInCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('IN requires 2 operands'));
        }
        return (Array.isArray(operands[1]) && operands[1].length === 0) 
            ? 'FALSE'
            : `${this.getFieldName(operands[0])} IN (${this.db.escape(operands[1])})`;
    }

    buildNotInCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT IN requires 2 operands'));
        }
        return (Array.isArray(operands[1]) && operands[1].length === 0) 
            ? 'TRUE'
            : `${this.getFieldName(operands[0])} NOT IN (${this.db.escape(operands[1])})`;
    }

    // LIKE

    buildLikeCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('LIKE requires 2 operands'));
        }
        return `${this.getFieldName(operands[0])} LIKE ${this.db.escape(operands[1])}`;
    }

    buildNotLikeCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT LIKE requires 2 operands'));
        }
        return `${this.getFieldName(operands[0])} NOT LIKE ${this.db.escape(operands[1])}`;
    }

    // BETWEEN

    buildBetweenCondition (operands) {
        if (operands.length !== 3) {
            throw new Error(this.wrapClassMessage('BETWEEN requires 3 operands'));
        }
        return `${this.getFieldName(operands[0])} BETWEEN ${this.db.escape(operands[1])} AND ${this.db.escape(operands[2])}`;
    }

    buildNotBetweenCondition (operands) {
        if (operands.length !== 3) {
            throw new Error(this.wrapClassMessage('NOT BETWEEN requires 3 operands'));
        }
        return `${this.getFieldName(operands[0])} NOT BETWEEN ${this.db.escape(operands[1])} AND ${this.db.escape(operands[2])}`;
    }

    // ID

    buildIdCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('ID requires 2 operands'));
        }
        let value = operands[1];
        if (value === null || value === undefined) {
            return this.buildNullCondition(operands.slice(0, 1));
        }
        return Array.isArray(operands[1]) 
            ? `${this.getFieldName(operands[0])} IN (${this.db.escape(value)})`
            : `${this.getFieldName(operands[0])}=${this.db.escape(value)}`;
    }

    buildNotIdCondition (operands) {
        if (operands.length !== 2) {
            throw new Error(this.wrapClassMessage('NOT ID requires 2 operands'));
        }
        let value = operands[1];
        if (value === null || value === undefined) {
            return this.buildNotNullCondition(operands.slice(0, 1));
        }
        return Array.isArray(operands[1])
            ? `${this.getFieldName(operands[0])} NOT IN (${this.db.escape(value)})`
            : `${this.getFieldName(operands[0])}=${this.db.escape(value)}`;
    }

    // FALSE

    buildFalseCondition () {
        return ' FALSE ';
    }

    // NULL

    buildNullCondition (operands) {
        if (operands.length !== 1) {
            throw new Error(this.wrapClassMessage('NULL requires 1 operand'));
        }
        return `${this.getFieldName(operands[0])} IS NULL`;
    }

    buildNotNullCondition (operands, operator) {
        if (operands.length !== 1) {
            throw new Error(this.wrapClassMessage('NOT NULL requires 1 operand'));
        }
        return `${this.getFieldName(operands[0])} IS NOT NULL`;
    }
};