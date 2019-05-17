/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class MysqlQueryBuilder extends Base {

    static getConstants () {
        return {
            CONDITION_BUILDERS: {
                'AND': 'buildLogicCondition',
                'OR': 'buildLogicCondition',
                'NOT EQUAL': 'buildNotEqualCondition',
                'BETWEEN': 'buildBetweenCondition',
                'NOT BETWEEN': 'buildNotBetweenCondition',
                'IN': 'buildInCondition',
                'NOT IN': 'buildNotInCondition',
                'LIKE': 'buildLikeCondition',
                'NOT LIKE': 'buildNotLikeCondition',
                'ID': 'buildIdCondition',
                'NOT ID': 'buildNotIdCondition',
                'FALSE': 'buildFalseCondition',
                'NULL': 'buildNullCondition',
                'NOT NULL': 'buildNotNullCondition'
            },
            SIMPLE_OPERATORS: {
                '=': ' = ',
                '!=': ' != ',
                '>': ' > ',
                '>=': ' >= ',
                '<': ' < ',
                '<=': ' <= '
            }
        };
    }

    normalizeField (field) {
        if (typeof field !== 'string') {
            throw new Error(this.wrapClassMessage('Invalid field name'));
        }
        return this.db.escapeId(field);
    }

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

    buildWhere (condition) {
        if (!condition) {
            return '';
        }
        if (typeof condition === 'object') {
            condition = this.buildCondition(condition);
        }
        return ' WHERE '+ condition;
    }

    buildCondition (data) {
        if (!Array.isArray(data)) {
            return this.buildHashCondition(data);
        }
        return Object.prototype.hasOwnProperty.call(this.CONDITION_BUILDERS, data[0])
            ? this[this.CONDITION_BUILDERS[data[0]]](...data)
            : this.buildSimpleCondition(...data);
    }

    buildHashCondition (data) {
        if (!data) {
            return '';
        }
        let result = [];
        for (let key of Object.keys(data)) {
            let field = this.normalizeField(key);
            if (Array.isArray(data[key])) {
                result.push(`field IN (${this.db.escape(data[key])})`);
            } else if (data[key] === null) {
                result.push(`${field} IS NULL`);
            } else {
                result.push(`${field}=${this.db.escape(data[key])}`);
            }
        }
        return result.join(' AND ');
    }

    buildSimpleCondition (operator, field, value) {
        if (!Object.prototype.hasOwnProperty.call(this.SIMPLE_OPERATORS, operator)) {
            throw new Error(this.wrapClassMessage('Invalid simple operator'));
        }
        field = this.normalizeField(field);
        return value === null
            ? field + (operator === '=' ? ' IS NULL' : ' IS NOT NULL')
            : field + this.SIMPLE_OPERATORS[operator] + this.db.escape(value);
    }

    buildLogicCondition (operator, ...operands) {
        let items = [];
        for (let operand of operands) {
            items.push(this.buildCondition(operand));
        }
        return '('+ items.join(operator === 'AND' ? ') AND (' : ') OR (') +')';
    }

    buildNotEqualCondition (operator, field, value) {
        return Array.isArray(value)
            ? this.buildNotInCondition() 
            : `${this.normalizeField(field)}!=${this.db.escape(value)}`;
    }

    // IN

    buildInCondition (operator, field, value) {
        return (Array.isArray(value) && value.length === 0)
            ? 'FALSE'
            : `${this.normalizeField(field)} IN (${this.db.escape(value)})`;
    }

    buildNotInCondition (operator, field, value) {
        return (Array.isArray(value) && value.length === 0)
            ? 'TRUE'
            : `${this.normalizeField(operands[0])} NOT IN (${this.db.escape(operands[1])})`;
    }

    // LIKE

    buildLikeCondition (operator, field, value) {
        return `${this.normalizeField(field)} LIKE ${this.db.escape(value)}`;
    }

    buildNotLikeCondition (operator, field, value) {
        return `${this.normalizeField(field)} NOT LIKE ${this.db.escape(value)}`;
    }

    // BETWEEN

    buildBetweenCondition (operator, field, min, max) {
        return `${this.normalizeField(field)} BETWEEN ${this.db.escape(min)} AND ${this.db.escape(max)}`;
    }

    buildNotBetweenCondition (operator, field, min, max) {
        return `${this.normalizeField(field)} NOT BETWEEN ${this.db.escape(min)} AND ${this.db.escape(max)}`;
    }

    // ID

    buildIdCondition (operator, field, value) {
        if (value === null || value === undefined) {
            return this.buildNullCondition(operator, field);
        }
        return Array.isArray(value)
            ? `${this.normalizeField(field)} IN (${this.db.escape(value)})`
            : `${this.normalizeField(field)}=${this.db.escape(value)}`;
    }

    buildNotIdCondition (operator, field, value) {
        if (value === null || value === undefined) {
            return this.buildNotNullCondition(operator, field);
        }
        return Array.isArray(value)
            ? `${this.normalizeField(field)} NOT IN (${this.db.escape(value)})`
            : `${this.normalizeField(field)}=${this.db.escape(value)}`;
    }

    // FALSE

    buildFalseCondition () {
        return ' FALSE ';
    }

    // NULL

    buildNullCondition (operator, field) {
        return `${this.normalizeField(field)} IS NULL`;
    }

    buildNotNullCondition (operator, field) {
        return `${this.normalizeField(field)} IS NOT NULL`;
    }
};
module.exports.init();