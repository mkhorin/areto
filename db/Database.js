/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Database extends Base {

    static getConstants () {
        return {            
            EVENT_OPEN_CONNECTION: 'openConnection',
            EVENT_CLOSE_CONNECTION: 'closeConnection',
            EVENT_ERROR: 'error',
            EVENT_COMMAND: 'command'
        };
    }

    static normalizeId (id) {
        return id;
    }

    constructor (config) {
        super(config);
        this._connection = null;
        this._builder = this.spawn(this.QueryBuilder, {db: this});
    }

    async init () {
        await this.open();
    }

    async open () {
        if (this._connection) {
            throw new Error(`Connection is already opened: ${this.getUri()}`);
        }
        this._connection = await this.openConnection();
        this.log('info', `Connection opened: ${this.getUri()}`);
        await this.trigger(this.EVENT_OPEN_CONNECTION);
    }

    async close () {
        if (!this._connection) {
            throw new Error(`Connection is already closed: ${this.getUri()}`);
        }
        await this.closeConnection();
        this._connection = null;
        this.log('info', `Connection closed: ${this.getUri()}`);
        await this.trigger(this.EVENT_CLOSE_CONNECTION);
    }

    async openConnection () {
        throw new Error('Open connection');
    }

    async closeConnection () {
        throw new Error('Close connection');
    }

    normalizeId (id) {
        return this.constructor.normalizeId(id);
    }

    getUri (withPassword) {
        const {database, host, port, user, password} = this.settings;
        const auth = user ? (user +':'+ (withPassword ? password : '*') +'@') : '';
        return `${this.schema}://${auth}${host}:${port}/${database}`;
    }

    logCommand (command, data) {
        this.log('trace', `${this.settings.database}: ${command}`, data);
    }

    afterError (message, data) {
        this.log('error', message, data);
        return this.trigger(this.EVENT_ERROR, {message, data});
    }

    buildCondition (condition) {
        return this._builder.buildWhere(condition);
    }

    async buildQuery (query) {
        await query.prepare();
        return this._builder.build(query);
    }
};