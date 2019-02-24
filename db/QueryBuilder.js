/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class QueryBuilder {

    static wrapClassMessage (message) {
        return `${this.name}: ${message}`;
    }

    constructor (db) {
        this.db = db;
    }

    build (query) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    wrapClassMessage (message) {
        return this.constructor.wrapClassMessage(message);
    }
};