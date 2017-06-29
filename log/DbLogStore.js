'use strict';

const Base = require('./LogStore');

module.exports = class DbLogStore extends Base {

    constructor (config) {
        super(Object.assign({
            db: config.logger.module.getDb(),
            table: 'log',
            pk: '_id',
            observePeriod: 60, // seconds, null - off
            maxRows: 10000
        }, config));
    }

    init () {
        super.init();        
        if (this.observePeriod) {
            this.observe();
        }
    }

    save (type, message, data) {
        this.getQuery().insert(this.format(type, message, data), err => {
            if (err) {
                console.error(`${this.constructor.name}: save`, err);
            }
        });
    }

    format (type, msg, data) {
        if (msg instanceof Exception) {
            msg = msg.toString();
        } else if (msg instanceof Error) {
            msg = `${msg.message} ${msg.stack}`;
        }
        return {
            type,
            message: msg,
            data: data instanceof Error ? data.stack : data,
            createdAt: new Date
        };
    }

    observe () {
        setTimeout(()=> {
            this.truncate(err => {
                err ? this.logger.module.log('error', `${this.constructor.name}: truncate`, err)
                    : this.observe();
            });
        }, this.observePeriod * 1000);
    }

    truncate (cb) {
        async.waterfall([
            cb => this.getQuery().count(cb),
            (counter, cb)=> {
                if (counter < this.maxRows + this.maxRows / 2) {
                    return cb();
                }
                async.waterfall([
                    cb => this.getQuery().offset(this.maxRows).orderBy({[this.pk]: -1}).scalar(this.pk, cb),
                    (id, cb)=> this.getQuery().where(['<', this.pk, id]).remove(cb)
                ], cb);
            },
        ], cb);
    }

    getQuery () {
        return (new Query).db(this.db).from(this.table);
    }
};

const async = require('async');
const Exception = require('../errors/Exception');
const Query = require('../db/Query');