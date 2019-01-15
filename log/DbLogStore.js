/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class DbLogStore extends Base {

    constructor (config) {
        super({
            'db': config.logger.module.getDb(),
            'table': 'log',
            'key': '_id',
            'observePeriod': 60, // seconds, null - off
            'maxRows': 10000,
            ...config
        });
        if (this.observePeriod) {
            this.observe();
        }
    }

    save (type, message, data) {
        this.find().insert(this.format(type, message, data)).catch(err => {    
            console.error(this.wrapClassMessage('save'), err);
        });
    }

    format (type, msg, data) {
        if (msg instanceof Exception) {
            msg = msg.toString();
        } else if (msg instanceof Error) {
            msg = `${msg.message} ${msg.stack}`;
        }
        return {
            'type': type,
            'message': msg,
            'data': data,
            'createdAt': new Date
        };
    }

    observe () {
        setTimeout(async ()=> {            
            try {
                await this.truncate();
                this.observe();
            } catch (err) {
                this.log('error', 'truncate', err);
            }
        }, this.observePeriod * 1000);
    }

    async truncate () {
        let counter = await this.find().count();
        if (counter >= this.maxRows + this.maxRows / 2) {
            let id = await this.find().offset(this.maxRows).order({[this.key]: -1}).scalar(this.key);
            await this.find(['<', this.key, id]).remove();
        }                    
    }

    find () {
        return (new Query).db(this.db).from(this.table);
    }
};

const util = require('util');
const Exception = require('../error/Exception');
const Query = require('../db/Query');