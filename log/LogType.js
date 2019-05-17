/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LogType extends Base {

    _counter = 0;

    constructor (config) {
        super({
            exclusive: false, 
            consoleMethod: 'log',
            dataStringifyOptions: {depth: 10},
            ...config
        });
        this.initStore();
    }

    initStore () {
        if (!this.store) {
            this.store = this.commonStore;
        } else if (!(this.store instanceof LogStore)) {
            this.store = ClassHelper.spawn(this.store, {
                logger: this.logger,
                logType: this
            });
        }
        if (this.exclusive || this.store === this.commonStore) {
            this.commonStore = null;
        }
    }

    getCounter () {
        return this._counter;
    }

    log (message, data) {
        if (!this.active) {
            return false;
        }
        data = this.formatData(data);
        if (this.consoleOutput) {
            console[this.consoleMethod](`${this.name}:`, message, data);
        }
        if (this.store instanceof LogStore) {
            this.store.save(this.name, message, data);
        }
        if (this.commonStore) {
            this.commonStore.save(this.name, message, data);
        }
        this._counter += 1;
        this.logger.afterLog(this.name, message, data);
    }

    formatData (data) {
        if (data instanceof Function) {
            return `[Function: ${data.name}]`;
        }
        if (data instanceof Error) {
            return data.stack;
        }
        return data ? util.inspect(data, this.dataStringifyOptions) : '';
    }
};

const util = require('util');
const LogStore = require('./LogStore');
const ClassHelper = require('../helper/ClassHelper');