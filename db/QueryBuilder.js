'use strict';

const Base = require('../base/Base');

module.exports = class QueryBuilder extends Base {

    constructor (db) {
        super({db});
    }

    build (query) {
        throw new Error('QueryBuilder: Need override');
    }
};