/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LogType extends Base {

    constructor (config) {
        super(Object.assign({
            exclusive: false, 
            consoleOutputMethod: 'log'
        }, config));

        this.counter = 0;
        this.initStore();
    }

    initStore () {
        if (!this.store) {
            this.store = this.commonStore;
        } else if (!(this.store instanceof LogStore)) {
            this.store = ClassHelper.createInstance(this.store, {
                logger: this.logger,
                logType: this
            });
        }
        if (this.exclusive || this.store === this.commonStore) {
            this.commonStore = null;
        }
    }

    log (message, data) {
        if (!this.active) {
            return false;
        }
        if (data instanceof Function) {
            data = `[Function: ${data.name}]`;
        }
        if (this.consoleOutput) {
            console[this.consoleOutputMethod](`${this.name}:`, message, data || '');
        }
        if (this.store instanceof LogStore) {
            this.store.save(this.name, message, data);
        }
        if (this.commonStore) {
            this.commonStore.save(this.name, message, data);
        }
        this.counter += 1;
        this.logger.afterLog(this.name, message, data);
    }
};

const LogStore = require('./LogStore');
const ClassHelper = require('../helper/ClassHelper');