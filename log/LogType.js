/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class LogType extends Base {

    constructor (config) {
        super({
            stores: [],
            consoleOutput: true,
            consoleMethod: 'log',
            dataStringifyOptions: {depth: 10},
            ...config
        });
        this._counter = 0;
    }

    getCounter () {
        return this._counter;
    }

    log (message, data) {
        data = this.formatData(data);
        if (this.consoleOutput) {
            console[this.consoleMethod](this.name +':', message, data);
        }
        for (let store of this.stores) {
            this.logger.stores[store].save(this.name, message, data);
        }
        this._counter += 1;
        this.logger.afterLog(this.name, message, data);
    }

    formatData (data) {
        if (typeof data === 'function') {
            return `[Function: ${data.name}]`;
        }
        if (data instanceof Error) {
            return data.stack;
        }
        return data === undefined ? '' : util.inspect(data, this.dataStringifyOptions);
    }
};

const util = require('util');