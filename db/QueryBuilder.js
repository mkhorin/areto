'use strict';

const Base = require('../base/Base');

module.exports = class QueryBuilder extends Base {

    constructor (db) {
        super({db});
    }

    build (query) {
        throw new Error(`${this.constructor.name}: Need to override`);
    }
};