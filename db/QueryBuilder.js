'use strict';

module.exports = class QueryBuilder {

    constructor (db) {
        this.db = db;
    }

    build (query) {
        throw new Error(`${this.constructor.name}: Need to override`);
    }
};