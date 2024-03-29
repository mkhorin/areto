/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class ActionProfiler extends Base {

    /**
     * @param {Object} config
     * @param {number} config.threshold - In milliseconds
     */
    constructor (config) {
        super({
            level: 'trace',
            threshold: 0,
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
        const {controller} = event.action;
        const time = Date.now() - controller.res.locals.startActionTimeProfiler;
        if (time >= this.threshold) {
            const message = this.formatTime(time, controller);
            this.logger.log(this.level, message);
        }
    }

    formatTime (time, controller) {
        const {code, method} = controller.response;
        const url = controller.getOriginalUrl();
        return `${code} ${method} ${time} ms ${url}`;
    }
};