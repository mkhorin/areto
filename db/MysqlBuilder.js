/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Builder');

module.exports = class MysqlBuilder extends Base {

    static getConstants () {
        return {
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

    escape (value) {
        return this.db.escape(value);
    }

    normalizeField (field) {
        if (typeof field !== 'string') {
            throw new Error('Invalid field name');
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
        const result = [];
        for (const key of Object.keys(order)) {
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
            sql +=` LIMIT ${cmd.offset},${cmd.limit ? cmd.limit : 99999999}`;
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
        return Object.prototype.hasOwnProperty.call(this.CONDITION_METHODS, data[0])
            ? this[this.CONDITION_METHODS[data[0]]](...data)
            : this.buildSimpleCondition(...data);
    }

    buildHashCondition (data) {
        if (!data) {
            return '';
        }
        const result = [];
        for (const key of Object.keys(data)) {
            const field = this.normalizeField(key);
            if (Array.isArray(data[key])) {
                data[key].length
                    ? result.push(`${field} IN (${this.escape(data[key])})`)
                    : result.push(`${field} IS NULL`);
            } else if (data[key] === null) {
                result.push(`${field} IS NULL`);
            } else {
                result.push(`${field}=${this.escape(data[key])}`);
            }
        }
        return result.join(' AND ');
    }

    buildSimpleCondition (operator, field, value) {
        if (!Object.prototype.hasOwnProperty.call(this.SIMPLE_OPERATORS, operator)) {
            throw new Error('Invalid simple operator');
        }
        field = this.normalizeField(field);
        return value === null
            ? field + (operator === '=' ? ' IS NULL' : ' IS NOT NULL')
            : field + this.SIMPLE_OPERATORS[operator] + this.escape(value);
    }

    // LOGIC

    buildAndCondition (operator, ...operands) {
        return '('+ operands.map(this.buildCondition, this).join(') AND (') +')';
    }

    buildOrCondition (operator, ...operands) {
        return '('+ operands.map(this.buildCondition, this).join(') OR (') +')';
    }

    buildNotCondition (operator, ...operands) {
        return 'NOT (('+ operands.map(this.buildCondition, this).join(') OR (') +'))';
    }

    // EQUAL

    buildEqualCondition (operator, field, value) {
        return `${this.normalizeField(field)}=${this.escape(value)}`;
    }

    buildNotEqualCondition (operator, field, value) {
        return Array.isArray(value)
            ? this.buildNotInCondition()
            : `${this.normalizeField(field)}!=${this.escape(value)}`;
    }

    // IN

    buildInCondition (operator, field, value) {
        return Array.isArray(value) && value.length === 0
            ? `${this.normalizeField(field)} IS NULL`
            : `${this.normalizeField(field)} IN (${this.escape(value)})`;
    }

    buildNotInCondition (operator, field, value) {
        return Array.isArray(value) && value.length === 0
            ? `${this.normalizeField(field)} IS NOT NULL`
            : `${this.normalizeField(field)} NOT IN (${this.escape(value)})`;
    }

    // LIKE

    buildLikeCondition (operator, field, value) {
        return `${this.normalizeField(field)} LIKE ${this.escape(value)}`;
    }

    buildNotLikeCondition (operator, field, value) {
        return `${this.normalizeField(field)} NOT LIKE ${this.escape(value)}`;
    }

    // BETWEEN

    buildBetweenCondition (operator, field, min, max) {
        return `${this.normalizeField(field)} BETWEEN ${this.escape(min)} AND ${this.escape(max)}`;
    }

    buildNotBetweenCondition (operator, field, min, max) {
        return `${this.normalizeField(field)} NOT BETWEEN ${this.escape(min)} AND ${this.escape(max)}`;
    }

    // ID

    buildIdCondition (operator, field, value) {
        if (value === null || value === undefined) {
            return this.buildNullCondition(operator, field);
        }
        return Array.isArray(value)
            ? `${this.normalizeField(field)} IN (${this.escape(value)})`
            : `${this.normalizeField(field)}=${this.escape(value)}`;
    }

    buildNotIdCondition (operator, field, value) {
        if (value === null || value === undefined) {
            return this.buildNotNullCondition(operator, field);
        }
        return Array.isArray(value)
            ? `${this.normalizeField(field)} NOT IN (${this.escape(value)})`
            : `${this.normalizeField(field)}=${this.escape(value)}`;
    }

    // FALSE

    buildFalseCondition () {
        return ' FALSE ';
    }

    // EMPTY

    buildEmptyCondition (operator, field) {
        field = this.normalizeField(field);
        return `${field} IS NULL OR ${field} = ''`;
    }

    buildNotEmptyCondition (operator, field) {
        field = this.normalizeField(field);
        return `${field} IS NOT NULL AND ${field} != ''`;
    }

    // NULL

    buildNullCondition (operator, field) {
        return `${this.normalizeField(field)} IS NULL`;
    }

    buildNotNullCondition (operator, field) {
        return `${this.normalizeField(field)} IS NOT NULL`;
    }

    // EXISTS

    buildExistsCondition (operator, field) {
        return `${this.normalizeField(field)} IS NULL`;
    }

    buildNotExistsCondition (operator, field) {
        return `${this.normalizeField(field)} IS NOT NULL`;
    }
};
module.exports.init();