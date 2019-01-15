/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class QueryBuilder {

    constructor (db) {
        this.db = db;
    }

    build (query) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }
};