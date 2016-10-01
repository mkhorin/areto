'use strict';

let Base = require('../base/Base');

module.exports = class QueryTrait extends Base {

    init () {        
        this._indexBy = null;
        this._limit = null;
        this._offset = null;
        this._orderBy = null;
        this._where = null;
    }

    from (table) {
        this._from = table;
        return this;
    }

    indexBy (column) {
        this._indexBy = column;
        return this;
    }

    // WHERE

    where (condition) {
        this._where = condition ? condition : null;
        return this;
    }

    andWhere (condition) {
        if (condition) {
            this._where = this._where ? ['AND', this._where, condition] : condition;
        }
        return this;
    }

    orWhere (condition) {
        if (condition) {
            this._where = this._where ? ['OR', this._where, condition] : condition;
        }
        return this;
    }

    filterWhere (condition) {
        condition = this.filterCondition(condition);
        condition.length && this.where(condition);
        return this;
    }

    andFilterWhere (condition) {
        condition = this.filterCondition(condition);
        condition.length && this.andWhere(condition);
        return this;
    }

    orFilterWhere (condition) {
        condition = this.filterCondition(condition);
        condition.length && this.orWhere(condition);
        return this;
    }

    // FILTER

    filterCondition (condition) {
        // operator format: operator, operand 1, operand 2, ...
        if (condition instanceof Array) {
            let operator = condition[0];
            switch (operator.toLowerCase()) {
                case 'NOT':
                case 'AND':
                case 'OR':
                    for (let i = condition.length - 1; i > 0; --i) {
                        let sub = this.filterCondition(condition[i]);
                        if (this.isEmpty(sub)) {
                            condition.splice(i, 1);
                        } else {
                            condition[i] = sub;
                        }
                    }
                    if (!condition.length) {
                        return [];
                    }
                    break;

                case 'BETWEEN':
                case 'NOT BETWEEN':
                    if (condition.length === 3 && (this.isEmpty(condition[1]) || this.isEmpty(condition[2]))) {
                         return [];
                    }
                    break;

                default:
                    if (condition.length > 1 && this.isEmpty(condition[1])) {
                        return [];
                    }
            }
        } else {
            // hash format: { 'column1': 'value1', 'column2': 'value2', ... }
            for (let name in condition) {
                if (this.isEmpty(condition[name])) {
                    delete condition[name];
                }
            }
        }
        return condition;
    }

    isEmpty (value) {
        return value === undefined || value === null || value === ''
            || (typeof value === 'string' && value.trim() === '')            
            || (typeof value === 'object' && Object.keys(value).length === 0);
    }

    // ORDER BY
    /**
     * @param columns - { attr1: 'ASC', attr2: 'DESC' }
     */
    orderBy (columns) {
        this._orderBy = columns;
        return this;
    }

    addOrderBy (columns) {
        this._orderBy = Object.assign(this._orderBy || {}, columns);
        return this;
    }

    orderByIn (state) {
        this._orderByIn = state;
        return this;
    }

    // OFFSET

    limit (limit) {
        this._limit = limit === null ? null : parseInt(limit);
        return this;
    }

    offset (offset) {
        this._offset = offset === null ? null : parseInt(offset);
        return this;
    }
};