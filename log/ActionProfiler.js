/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class ActionProfiler extends Base {

    constructor (config) {
        super({
            level: 'debug',
            threshold: 0, // ms
            logger: 'logger',
            ...config
        });
    }

    init () {
        this.logger = this.module.get(this.logger);
        if (this.logger.getType(this.level)) {
            this.module.addHandler('use', this.start);
            this.module.on(this.module.EVENT_AFTER_ACTION, this.end.bind(this));
        }
    }

    start (req, res, next) {
        res.locals.startActionTimeProfiler = Date.now();
        next();
    }

    end (event) {
        const controller = event.action.controller;
        const time = Date.now() - controller.res.locals.startActionTimeProfiler;
        if (time >= this.threshold) {
            this.logger.log(this.level, this.formatTime(time, controller));
        }
    }

    formatTime (time, controller) {
        return `${controller.response.code} ${controller.req.method} ${time} ms ${controller.req.originalUrl}`;
    }
};