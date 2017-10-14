'use strict';

const Base = require('../base/Component');

module.exports = class Driver extends Base {

    static getConstants () {
        return {            
            EVENT_OPEN: 'openConnection',
            EVENT_CLOSE: 'closeConnection',
            EVENT_ERROR: 'error',
            EVENT_COMMAND: 'command'
        };
    }

    static normalizeId (id) {
        return id;
    }

    init () {
        super.init();
        this.connection = null;
        this.builder = new this.QueryBuilder(this);
        if (this.module.components.logger) {
            this.module.components.logger.traceDb(this);
        }
    }

    normalizeId () {
        return this.constructor.normalizeId.apply(this.constructor, arguments);
    }

    getUri (withPassword) {
        let opt = this.settings;
        let auth = opt.user ? (opt.user +':'+ (withPassword ? opt.password : '*') +'@') : '';
        return `${this.schema}://${auth}${opt.host}:${opt.port}/${opt.database}`;
    }

    openClient (cb) {
        cb(`${this.constructor.name}: open client`);
    }

    closeClient (cb) {
        cb(`${this.constructor.name}: close client`);
    }

    open (cb) {
        if (this.connection) {
            return cb(`${this.constructor.name}: Connection is already opened: ${this.getUri()}`);
        }
        async.waterfall([
            this.openClient.bind(this),
            (connection, cb)=> {
                this.connection = connection;
                this.log('info', `Connection is opened: ${this.getUri()}`);
                this.trigger(this.EVENT_OPEN);
                cb();
            }    
        ], cb);
    }

    close (cb) {
        if (!this.connection) {
            return cb(`${this.constructor.name}: Connection is already closed: ${this.getUri()}`);
        }
        async.series([
            this.closeClient.bind(this),
            cb => {
                this.connection = null;
                this.log('info', `Connection is closed: ${this.getUri()}`);
                this.trigger(this.EVENT_CLOSE);
                cb();
            }
        ], cb);
    }

    afterCommand (err, data) {
        if (err) {
            return this.afterError(`db: ${this.settings.database}`, Object.assign({err}, data));
        }
        this.trigger(this.EVENT_COMMAND, {
            message: `db: ${this.settings.database}`,
            data
        });
    }

    afterError (message, data) {
        this.log('error', message, data);
        this.trigger(this.EVENT_ERROR, {message, data});
    }

    formatCommandData (data) {
        return JSON.stringify(data);
    }

    buildCondition (condition) {
        return this.builder.buildWhere(condition);
    }

    buildQuery (query, cb) {
        query.prepare(err => {
            if (err) {
                return cb(err);
            }
            try {
                query = this.builder.build(query);
            } catch (err) {
                return cb(err);
            }
            cb(null, query);
        });
    }
};

const async = require('async');