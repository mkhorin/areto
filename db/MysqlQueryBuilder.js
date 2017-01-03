'use strict';

const Base = require('./QueryBuilder');
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
    //'EXISTS': 'buildExistsCondition',
    //'NOT EXISTS': 'buildExistsCondition'
    'ID': 'buildIdCondition',
    'FALSE': 'buildFalseCondition',
    'NULL': 'buildNullCondition'
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
            from: this.db.escapeId(query._from),
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
        return select ? this.db.escapeId(select) : '*';
    }

    buildOrder (order) {
        if (!order) {
            return null;
        }
        let result = [];
        for (let key in order) {
            result.push(`${this.db.escapeId(key)} ${order[key]}`);
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
            throw new Error('MysqlQueryBuilder: Invalid field name');
        }
        return this.db.escapeId(field);
    }

    buildWhere (condition) {
        return  condition ? (' WHERE '+ (typeof condition === 'object' ? this.buildCondition(condition) : condition)) : '';
    }

    buildCondition (condition) {
        if (condition instanceof Array) {
            let operator = condition[0];
            return Object.prototype.hasOwnProperty.call(CONDITION_BUILDERS, operator)
                ? this[CONDITION_BUILDERS[operator]](operator, condition.slice(1))
                : this.buildSimpleCondition(operator, condition.slice(1));
        }
        return this.buildHashCondition(condition);
    }

    // hash format: 'column1': 'value1', 'column2': 'value2'
    buildHashCondition (condition) {
        let result = [];
        for (let key in condition) {
            let field = this.getFieldName(key);
            if (condition[key] instanceof Array) {
                result.push(`field IN (${this.db.escape(condition[key])})`);
            } else if (condition[key] === null) {
                result.push(`${field} IS NULL`);
            } else {
                result.push(`${field}=${this.db.escape(condition[key])}`);
            }
        }
        return result.join(' AND ');
    }

    buildSimpleCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: Simple requires 2 operands.');
        }
        if (!Object.prototype.hasOwnProperty.call(SIMPLE_OPERATORS, operator)) {
            throw new Error('MysqlQueryBuilder: Simple operator not found.');
        }
        let field = this.getFieldName(operands[0]);
        return operands[1] === null
            ? field + (operator === '=' ? ' IS NULL' : ' IS NOT NULL')
            : field + SIMPLE_OPERATORS[operator] + this.db.escape(operands[1]);
    }

    buildAndCondition (operator, operands) {
        let result = [];
        for (let operand in operands) {
            result.push(this.buildCondition(operand));
        }
        return '('+ result.join(operator === 'AND' ? ') AND (' : ') OR (') +')';
    }

    buildNotEqualCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: NOT EQUAL requires 2 operands.');
        }
        return operands[1] instanceof Array 
            ? this.buildNotInCondition() 
            : {[this.getFieldName(operands[0])]: {$ne: operands[1]}};
    }

    // IN

    buildInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: IN requires 2 operands.');
        }
        return (operands[1] instanceof Array && operands[1].length === 0) 
            ? 'FALSE'
            : `${this.getFieldName(operands[0])} IN (${this.db.escape(operands[1])})`;
    }

    buildNotInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: NOT IN requires 2 operands.');
        }
        return (operands[1] instanceof Array && operands[1].length === 0) 
            ? 'TRUE'
            : `${this.getFieldName(operands[0])} NOT IN (${this.db.escape(operands[1])})`;
    }

    // LIKE

    buildLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: LIKE requires 2 operands.');
        }
        return `${this.getFieldName(operands[0])} LIKE ${this.db.escape(operands[1])}`;
    }

    buildNotLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: NOT LIKE requires 2 operands.');
        }
        return `${this.getFieldName(operands[0])} NOT LIKE ${this.db.escape(operands[1])}`;
    }

    // BETWEEN

    buildBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error('MysqlQueryBuilder: BETWEEN requires 3 operands.');
        }
        return `${this.getFieldName(operands[0])} BETWEEN ${this.db.escape(operands[1])} AND ${this.db.escape(operands[2])}`;
    }

    buildNotBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error('MysqlQueryBuilder: NOT BETWEEN requires 3 operands.');
        }
        return `${this.getFieldName(operands[0])} NOT BETWEEN ${this.db.escape(operands[1])} AND ${this.db.escape(operands[2])}`;
    }

    // ID

    buildIdCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error('MysqlQueryBuilder: ID requires 2 operands.');
        }
        let result = this.getFieldName(operands[0]);
        return  operands[1] instanceof Array 
            ? `${result} IN (${this.db.escape(operands[1])})`
            : `${result}=${this.db.escape(operands[1])}`;
    }

    buildFalseCondition () {
        return ' FALSE ';
    }

    buildNullCondition (operator, operands) {
        return this.getFieldName(operands[0]) + (operator === 'NULL' ? ' IS NULL' : ' IS NOT NULL');
    }
};