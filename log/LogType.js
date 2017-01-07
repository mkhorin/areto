'use strict';

const Base = require('../base/Base');
const MainHelper = require('../helpers/MainHelper');

module.exports = class LogType extends Base {

    constructor (config) {
        super(Object.assign({
            exclusive: false, 
            consoleOutputMethod: 'log'
        }, config));
    }

    init () {        
        this.store = this.store 
            ? MainHelper.createInstance(this.store, {logger: this.logger})
            : this.commonStore;
        if (this.exclusive || this.store === this.commonStore) {
            this.commonStore = null;
        }
    }

    log (message, data) {
        if (this.active) {            
            if (this.consoleOutput) {                
                console[this.consoleOutputMethod](`${this.name}:`, message, data ? data : '');
            }
            if (this.store instanceof LogStore) {
                this.store.save(this.name, message, data);
            }
            if (this.commonStore) {
                this.commonStore.save(this.name, message, data);
            }
            this.logger.afterLog(this.name, message, data);
        }
    }
};

const Exception = require('../errors/Exception');
const LogStore = require('./LogStore');