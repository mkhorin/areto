'use strict';

const Base = require('../base/Component');

module.exports = class QueryBuilder extends Base {

    constructor (db) {
        super({db});
    }

    build (query) {
        throw new Error('QueryBuilder: Need override');
    }
};