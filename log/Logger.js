'use strict';

const Base = require('../base/Component');
const MainHelper = require('../helpers/MainHelper');

module.exports = class Logger extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_LOG: 'afterLog'
        };
    }

    constructor (config) {
        super(Object.assign({
            level: 'info', // and right types
            typeNames: ['trace', 'debug', 'info', 'warning', 'error', 'fatal'],
            types: {},
            store: FileLogStore, // common store
            consoleOutput: true,
            processingTimeTreshold: 0, // ms
            dbTraced: true
        }, config));
    }

    init () {
        super.init();
        this.store = MainHelper.createInstance(this.store, {
            logger: this
        });
        let errorOutputIndex = this.typeNames.indexOf('info');
        for (let i = 0; i < this.typeNames.length; ++i) {
            this.initType(this.typeNames[i], {
                consoleOutputMethod: i > errorOutputIndex ? 'error' : 'log'
            });
        }
    }

    configure () {
        if (this.isTrace()) {
            this.traceProcessingTime();
        }
    }

    initType (name, config) {
        let type = this.types[name];
        config = Object.assign({
            name,
            logger: this,
            commonStore: this.store,
            store: this.store,
            active: this.isActiveTypeName(name),
            consoleOutput: this.consoleOutput,
            exclusive: this.exclusive, // not copy to commonStore
            eventFire: this.eventFire
        }, config);
        if (type instanceof LogType) {
            Object.assign(config, type);
            Object.assign(type, config);
        } else if (type) {
            type = MainHelper.createInstance(type, Object.assign(config, type[1]));
        } else {
            type = new LogType(config);
        }
        this.types[name] = type;
        this.setTypeShortcut(name);
    }

    isActiveTypeName (name) {
        return this.level && this.typeNames.indexOf(name) >= this.typeNames.indexOf(this.level);
    }

    setTypeShortcut (name) {
        if (name in this) {
            this.log('error', `Logger: setTypeShortcut: already taken: ${name}`);
        } else {
            this[name] = (message, data)=> this.log(name, message, data);
        }
    }

    isActive (type) {
        return type in this.types ? this.types[type].active : false;
    }

    isTrace () {
        return this.isActive('trace');
    }

    isDebug () {
        return this.isActive('debug');
    }

    log (type, message, data) {
        if (type in this.types) {
            this.types[type].log(message, data);            
        } else if (this.types.error) {
            this.types.error.log(`Logger: Not found type: ${type}`, {message, data});
        } else {
            console.error('Logger: Not found type:', type, message, data);
        }
    }

    traceProcessingTime () {
        this.module.appendToExpress('use', (req, res, next)=> {
            res.locals.startProcessingTime = (new Date).getTime();
            next();
        });
        this.module.on(this.module.EVENT_AFTER_ACTION, (event, cb)=> {
            let controller = event.action.controller;
            let time = (new Date).getTime() - controller.res.locals.startProcessingTime;
            if (time >= this.processingTimeTreshold) {
                this.log('trace', this.formatProcessingTime(time, controller));
            }
            cb();
        });
    }

    formatProcessingTime (time, controller) {
        let req = controller.req;  
        return `${controller.res.statusCode} ${req.method} ~${time} ms ${req.originalUrl}`;
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
};
module.exports.init();

const LogType = require('./LogType');
const FileLogStore = require('./FileLogStore');
const ExtEvent = require('../base/ExtEvent');