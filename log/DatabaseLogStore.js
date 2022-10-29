/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./LogStore');

module.exports = class DatabaseLogStore extends Base {

    /**
     * @param {Object} config
     * @param {number} config.observePeriod - In seconds (null to off)
     */
    constructor (config) {
        super({
            table: 'log',
            key: '_id',
            observePeriod: 60,
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
        data = this.format(type, message, data);
        this.createQuery()
            .insert(data)
            .catch(this.onError.bind(this, 'save'));
    }

    onError (name, error) {
        console.error(this.wrapClassMessage(name), error);
    }

    format (type, message, data) {
        if (message instanceof Exception) {
            message = message.toString();
        } else if (message instanceof Error) {
            message = `${message.message} ${message.stack}`;
        }
        const createdAt = new Date;
        return {type, message, data, createdAt};
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
        } catch (error) {
            this.onError('checkout', error);
        }
    }

    async truncate () {
        const counter = await this.createQuery().count();
        if (counter >= this.maxRows + this.maxRows / 2) {
            const order = {[this.key]: -1};
            const id = await this.createQuery()
                .offset(this.maxRows)
                .order(order)
                .scalar(this.key);
            await this.createQuery()
                .and(['<', this.key, id])
                .delete();
        }
    }

    createQuery () {
        return (new Query).db(this.db).from(this.table);
    }
};

const Exception = require('../error/Exception');
const Query = require('../db/Query');