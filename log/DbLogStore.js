'use strict';

const Base = require('./LogStore');

module.exports = class DbLogStore extends Base {

    constructor (config) {
        super(Object.assign({
            db: config.logger.module.getDb(),
            table: 'log',
            key: '_id',
            observePeriod: 60, // seconds, null - off
            maxRows: 10000
        }, config));

        if (this.observePeriod) {
            this.observe();
        }
    }

    save (type, message, data) {
        this.find().insert(this.format(type, message, data), err => {
            if (err) {
                console.error(this.wrapClassMessage('save'), err);
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
                err ? this.log('error', 'truncate', err)
                    : this.observe();
            });
        }, this.observePeriod * 1000);
    }

    truncate (cb) {
        AsyncHelper.waterfall([
            cb => this.find().count(cb),
            (counter, cb)=> {
                if (counter < this.maxRows + this.maxRows / 2) {
                    return cb();
                }
                AsyncHelper.waterfall([
                    cb => this.find().offset(this.maxRows).order({[this.key]: -1}).scalar(this.key, cb),
                    (id, cb)=> this.find(['<', this.key, id]).remove(cb)
                ], cb);
            },
        ], cb);
    }

    find () {
        return (new Query).db(this.db).from(this.table);
    }
};

const AsyncHelper = require('../helper/AsyncHelper');
const Exception = require('../error/Exception');
const Query = require('../db/Query');