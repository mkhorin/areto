/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Driver extends Base {

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
        this.connection = null;
        this.builder = new this.QueryBuilder(this);
    }

    normalizeId () {
        return this.constructor.normalizeId.apply(this.constructor, arguments);
    }

    getUri (withPassword) {
        let opt = this.settings;
        let auth = opt.user ? (opt.user +':'+ (withPassword ? opt.password : '*') +'@') : '';
        return `${this.schema}://${auth}${opt.host}:${opt.port}/${opt.database}`;
    }

    async openClient () {
        throw new Error(this.wrapClassMessage('Need to open client'));
    }

    async closeClient () {
        throw new Error(this.wrapClassMessage('Need to close client'));
    }

    async open () {
        if (this.connection) {
            throw new Error(this.wrapClassMessage(`Connection is already opened: ${this.getUri()}`));
        }
        this.connection = await this.openClient();
        this.log('info', `Connection is opened: ${this.getUri()}`);
        this.trigger(this.EVENT_OPEN_CONNECTION);
    }

    async close () {
        if (!this.connection) {
            throw new Error(this.wrapClassMessage(`Connection is already closed: ${this.getUri()}`));
        }
        await this.closeClient();
        this.connection = null;
        this.log('info', `Connection is closed: ${this.getUri()}`);
        this.trigger(this.EVENT_CLOSE_CONNECTION);
    }

    logCommand (command, data = {}) {
        let message = `${this.settings.database}: ${command}`;
        this.log('trace', message, data);
    }

    afterError (message, data) {
        this.log('error', message, data);
        this.trigger(this.EVENT_ERROR, {message, data});
    }

    buildCondition (condition) {
        return this.builder.buildWhere(condition);
    }

    async buildQuery (query) {
        await query.prepare();
        return this.builder.build(query);
    }
};