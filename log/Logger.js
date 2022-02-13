/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Logger extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_LOG: 'afterLog'
        };
    }

    constructor (config) {
        super({
            depends: '#start',
            level: 'trace',
            defaultStores: {
                common: require('./FileLogStore'),
                error: require('./FileLogStore')
            },
            defaultTypes: {
                error: {
                    stores: ['common', 'error']
                },
                fatal: {
                    stores: ['common', 'error']
                }
            },
            typeNames: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
            LogType: {
                Class: require('./LogType'),
                stores: ['common']
            },
            consoleOutput: true,
            errorConsoleLevel: 'warn',
            ...config
        });
        this._levelIndex = this.getTypeNameIndex(this.level);
        this._errorConsoleIndex = this.getTypeNameIndex(this.errorConsoleLevel);
        this.createStores();
        this.createTypes();
    }

    async init () {
        for (const store of Object.values(this.stores)) {
            await store.init();
        }
    }

    isActiveType (name) {
        return this.getType(name);
    }

    isTrace () {
        return this.types.trace;
    }

    isDebug () {
        return this.types.debug;
    }

    getTypeNameIndex (name) {
        const index = this.typeNames.indexOf(name);
        if (index < 0) {
            throw Error(`Unknown type name: ${name}`);
        }
        return index;
    }

    getType (name) {
        return this.types.hasOwnProperty(name) ? this.types[name] : null;
    }

    getStore (name) {
        return this.stores[name] instanceof LogStore ? this.stores[name] : null;
    }

    createStores () {
        const logger = this;
        this.stores = {...this.defaultStores, ...this.stores};
        for (const name of Object.keys(this.stores)) {
            this.stores[name] = this.spawn(this.stores[name], {logger, name});
        }
    }

    createTypes () {
        this.types = {...this.defaultTypes, ...this.types};
        for (let i = 0; i < this.typeNames.length; ++i) {
            const name = this.typeNames[i];
            this.types[name] = this._levelIndex > i ? null : this.createType(name, i);
        }
    }

    createType (name, index) {
        return this.spawn({
            ...this.LogType,
            consoleOutput: this.consoleOutput,
            consoleMethod: this.getConsoleMethod(index),
            ...this.types[name],
            logger: this,
            name
        });
    }

    getConsoleMethod (index) {
        return index < this._errorConsoleIndex ? 'log' : 'error';
    }

    log (type, message, data) {
        if (!this.types.hasOwnProperty(type)) {
            this.logInvalidType(type, message, data);
        } else if (this.types[type]) {
            this.types[type].log(message, data);
        }
    }

    logInvalidType (type, message, data) {
        type = this.wrapClassMessage(`Unknown type: ${type}`);
        this.types.error
            ? this.types.error.log(type, {message, data})
            : console.error(type, message, data);
    }

    getCounters (names) {
        const counters = [];
        names = Array.isArray(names) ? names : this.typeNames;
        for (const name of names) {
            const type = this.getType(name);
            if (type) {
                const counter = type.getCounter();
                if (counter) {
                    counters.push({type: name, counter});
                }
            }
        }
        return counters;
    }

    afterLog (type, message, data) {
        this.trigger(this.EVENT_AFTER_LOG, {type, message, data});
    }
};
module.exports.init();

const LogStore = require('./LogStore');