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
            from: this.db.escapeId(query._from),
            select: this.buildSelect(query._select),
            where: this.buildWhere(query._where),
            order: this.buildOrder(query._order),
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
            throw new Error(`${this.constructor.name}: Invalid field name`);
        }
        return this.db.escapeId(field);
    }

    buildWhere (condition) {
        return  condition ? (' WHERE '+ (typeof condition === 'object' ? this.buildCondition(condition) : condition)) : '';
    }

    buildCondition (condition) {
        if (!(condition instanceof Array)) {
            return this.buildHashCondition(condition);    
        }
        let operator = condition[0];
        return Object.prototype.hasOwnProperty.call(CONDITION_BUILDERS, operator)
            ? this[CONDITION_BUILDERS[operator]](operator, condition.slice(1))
            : this.buildSimpleCondition(operator, condition.slice(1));        
    }

    buildHashCondition (condition) {        
        if (!condition) {
            return '';
        }
        let result = [];
        for (let key of Object.keys(condition)) {
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
            throw new Error(`${this.constructor.name}: Simple requires 2 operands.`);
        }
        if (!Object.prototype.hasOwnProperty.call(SIMPLE_OPERATORS, operator)) {
            throw new Error(`${this.constructor.name}: Simple operator not found.`);
        }
        let field = this.getFieldName(operands[0]);
        return operands[1] === null
            ? field + (operator === '=' ? ' IS NULL' : ' IS NOT NULL')
            : field + SIMPLE_OPERATORS[operator] + this.db.escape(operands[1]);
    }

    buildAndCondition (operator, operands) {
        let parts = [];
        if (operands instanceof Array) {
            for (let operand of operands) {
                parts.push(this.buildCondition(operand));
            }
        }
        return '('+ parts.join(operator === 'AND' ? ') AND (' : ') OR (') +')';
    }

    buildNotEqualCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: NOT EQUAL requires 2 operands.`);
        }
        return operands[1] instanceof Array 
            ? this.buildNotInCondition() 
            : {[this.getFieldName(operands[0])]: {$ne: operands[1]}};
    }

    // IN

    buildInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: IN requires 2 operands.`);
        }
        return (operands[1] instanceof Array && operands[1].length === 0) 
            ? 'FALSE'
            : `${this.getFieldName(operands[0])} IN (${this.db.escape(operands[1])})`;
    }

    buildNotInCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: NOT IN requires 2 operands.`);
        }
        return (operands[1] instanceof Array && operands[1].length === 0) 
            ? 'TRUE'
            : `${this.getFieldName(operands[0])} NOT IN (${this.db.escape(operands[1])})`;
    }

    // LIKE

    buildLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: LIKE requires 2 operands.`);
        }
        return `${this.getFieldName(operands[0])} LIKE ${this.db.escape(operands[1])}`;
    }

    buildNotLikeCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: NOT LIKE requires 2 operands.`);
        }
        return `${this.getFieldName(operands[0])} NOT LIKE ${this.db.escape(operands[1])}`;
    }

    // BETWEEN

    buildBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error(`${this.constructor.name}: BETWEEN requires 3 operands.`);
        }
        return `${this.getFieldName(operands[0])} BETWEEN ${this.db.escape(operands[1])} AND ${this.db.escape(operands[2])}`;
    }

    buildNotBetweenCondition (operator, operands) {
        if (operands.length !== 3) {
            throw new Error(`${this.constructor.name}: NOT BETWEEN requires 3 operands.`);
        }
        return `${this.getFieldName(operands[0])} NOT BETWEEN ${this.db.escape(operands[1])} AND ${this.db.escape(operands[2])}`;
    }

    // ID

    buildIdCondition (operator, operands) {
        if (operands.length !== 2) {
            throw new Error(`${this.constructor.name}: ID requires 2 operands.`);
        }
        let result = this.getFieldName(operands[0]);
        return  operands[1] instanceof Array 
            ? `${result} IN (${this.db.escape(operands[1])})`
            : `${result}=${this.db.escape(operands[1])}`;
    }

    // FALSE

    buildFalseCondition () {
        return ' FALSE ';
    }

    // NULL

    buildNullCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(`${this.constructor.name}: NULL requires 1 operand.`);
        }
        return `${this.getFieldName(operands[0])} IS NULL`;
    }

    buildNotNullCondition (operator, operands) {
        if (operands.length !== 1) {
            throw new Error(`${this.constructor.name}: NOT NULL requires 1 operand.`);
        }
        return `${this.getFieldName(operands[0])} IS NOT NULL`;
    }
};