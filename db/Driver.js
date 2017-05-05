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

    init () {
        super.init();
        this.connection = null;
        this.builder = new this.QueryBuilder(this);
        if (this.module.components.logger) {
            this.module.components.logger.traceDb(this);
        }
    }

    getUri (withPassword) {
        let opt = this.settings;
        let auth = opt.user ? (opt.user +':'+ (withPassword ? opt.password : '****') +'@') : '';
        return `${this.schema}://${auth}${opt.host}:${opt.port}/${opt.database}`;
    }

    openClient (cb) {
        cb('Driver: open client');
    }

    closeClient (cb) {
        cb('Driver: close client');
    }

    open (cb) {
        if (this.connection) {
            return cb(`Connection is already opened: ${this.getUri()}`);
        }
        this.openClient((err, connection)=> {
            if (err) {
                return cb(err);
            }
            this.connection = connection;
            this.module.log('info', `Connection is opened: ${this.getUri()}`);
            this.trigger(this.EVENT_OPEN);
            cb();
        });
    }

    close (cb) {
        if (!this.connection) {
            return cb(`Connection is already closed: ${this.getUri()}`);
        }
        this.closeClient(err => {
            if (err) {
                return cb(err);
            }
            this.connection = null;
            this.module.log('info', `Connection is closed: ${this.getUri()}`);
            this.trigger(this.EVENT_CLOSE);
            cb();
        });
    }

    afterError (message, data) {
        this.module.log('error', message, data);
        this.trigger(this.EVENT_ERROR, {message, data});
    }

    afterCommand (data) {
        if (data.err) {
            this.afterError(`db: ${this.settings.database}`, data);
        } else {
            this.trigger(this.EVENT_COMMAND, {
                message: `db: ${this.settings.database}`,
                data
            });
        }
    }

    formatCommandData (data) {
        return JSON.stringify(data);
    }

    indexOfId (id, ids) {
        return ids.indexOf(id);
    }

    normalizeId (id) {
        return id;
    }

    buildCondition (condition) {
        return this.builder.buildWhere(condition);
    }
};