/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class DatabaseLogStore extends Base {

    constructor (config) {
        super({
            table: 'log',
            key: '_id',
            observePeriod: 60, // seconds, null - off
            maxRows: 10000,
            ...config
        });
        this.db = this.module.getDb(this.db);
    }

    init () {
        if (this.observePeriod) {
            this.observe();
        }
    }

    save (type, message, data) {
        this.createQuery().insert(this.format(type, message, data)).catch(err => {
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
        const counter = await this.createQuery().count();
        if (counter >= this.maxRows + this.maxRows / 2) {
            const id = await this.createQuery().offset(this.maxRows).order({[this.key]: -1}).scalar(this.key);
            await this.createQuery().and(['<', this.key, id]).delete();
        }                    
    }

    createQuery () {
        return (new Query).db(this.db).from(this.table);
    }
};

const Exception = require('../error/Exception');
const Query = require('../db/Query');