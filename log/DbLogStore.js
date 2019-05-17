/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class DbLogStore extends Base {

    constructor (config) {
        super({
            db: config.logger.module.getDb(),
            table: 'log',
            key: '_id',
            observePeriod: 60, // seconds, null - off
            maxRows: 10000,
            ...config
        });
    }

    init () {
        if (this.observePeriod) {
            this.observe();
        }
    }

    save (type, message, data) {
        this.find().insert(this.format(type, message, data)).catch(err => {    
            console.error(this.wrapClassMessage('save'), err);
        });
    }

    format (type, message, data) {
        if (message instanceof Exception) {
            message = message.toString();
        } else if (message instanceof Error) {
            message = `${message.message} ${message.stack}`;
        }
        return {            
            type,
            message,
            data,
            createdAt: new Date
        };
    }

    observe () {
        setTimeout(async ()=> {
            await this.checkout();
            this.observe();
        }, this.observePeriod * 1000);
    }

    async checkout () {
        try {
            await this.truncate();
        } catch (err) {
            this.log('error', this.wrapClassMessage('checkout'), err);
        }
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

const Exception = require('../error/Exception');
const Query = require('../db/Query');