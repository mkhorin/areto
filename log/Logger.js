/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
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
        super(Object.assign({
            level: 'info', // and right types
            typeNames: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'],
            types: {},
            LogType: LogType,
            store: require('./FileLogStore'), // common store
            consoleOutput: true,
            processingTimeThreshold: 0, // ms
            dbTraced: true
        }, config));

        this.store = ClassHelper.createInstance(this.store, {
            logger: this
        });
        this.createTypes();
    }

    async init () {
        if (this.isDebug()) {
            this.traceProcessingTime();
        }
    }

    createTypes () {
        let errorOutputIndex = this.typeNames.indexOf('info');
        for (let i = 0; i < this.typeNames.length; ++i) {
            this.createType(this.typeNames[i], {
                consoleOutputMethod: i > errorOutputIndex ? 'error' : 'log'
            });
        }
    }

    createType (name, config) {
        let type = this.types[name];
        config = Object.assign({
            'Class': this.LogType,
            'name': name,
            'logger': this,
            'commonStore': this.store,
            'store': this.store,
            'active': this.isActiveTypeName(name),
            'consoleOutput': this.consoleOutput,
            'exclusive': this.exclusive, // not copy to commonStore
            'eventFire': this.eventFire
        }, config);

        if (type instanceof LogType) {
            Object.assign(config, type);
            Object.assign(type, config);
        } else {
            type = ClassHelper.createInstance(Object.assign(config, type));
        }
        this.types[name] = type;
        this.setTypeShortcut(name);
    }

    getType (name) {
        return this.types[name] instanceof LogType ? this.types[name] : null;
    }

    isActiveTypeName (name) {
        return this.level && this.typeNames.indexOf(name) >= this.typeNames.indexOf(this.level);
    }

    setTypeShortcut (name) {
        if (name in this) {
            return this.log('error', this.wrapClassMessage(`Type shortcut already taken: ${name}`));
        }
        this[name] = (message, data)=> this.log(name, message, data);
    }

    isActive (type) {
        return this.types.hasOwnProperty(type) ? this.types[type].active : false;
    }

    isTrace () {
        return this.isActive('trace');
    }

    isDebug () {
        return this.isActive('debug');
    }

    log (type, message, data) {
        if (Object.prototype.hasOwnProperty.call(this.types, type)) {
            return this.types[type].log(message, data);
        }
        type = this.wrapClassMessage(`Unknown type: ${type}`);
        this.types.error
            ? this.types.error.log(type, {message, data})
            : console.error(type, message, data);
    }

    traceProcessingTime () {
        this.module.appendToExpress('use', this.startProcessingTime);
        this.module.on(this.module.EVENT_AFTER_ACTION, this.endProcessingTime.bind(this));
    }

    startProcessingTime (req, res, next) {
        res.locals.startProcessingTime = Date.now();
        next();
    }

    endProcessingTime (event) {
        let controller = event.action.controller;
        let time = Date.now() - controller.res.locals.startProcessingTime;
        if (time >= this.processingTimeThreshold) {
            this.log('trace', this.formatProcessingTime(time, controller));
        }
        return Promise.resolve();
    }

    formatProcessingTime (time, controller) {
        let req = controller.req;  
        return `${controller.res.statusCode} ${req.method} ${time} ms ${req.originalUrl}`;
    }

    traceDb (db) {
        if (this.dbTraced && this.isTrace()) {
            db.on(db.EVENT_COMMAND, msg => {
                this.log('trace', msg.message, db.formatCommandData(msg.data));
            });
        }
    }

    afterLog (type, message, data) {
        this.trigger(this.EVENT_AFTER_LOG, {type, message, data});
    }

    getTotal (typeNames) {
        let total = [];
        typeNames = typeNames instanceof Array ? typeNames : this.typeNames;
        for (let name of typeNames) {
            let type = this.getType(name);
            if (type && type.counter) {
                total.push({
                    type: name,
                    counter: type.counter
                });
            }
        }
        return total;
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const LogType = require('./LogType');