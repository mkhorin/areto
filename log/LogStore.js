'use strict';

const Base = require('../base/Base');

module.exports = class LogStore extends Base {

    save (type, message, data) {
        throw new Error(`${this.constructor.name}: Need to override`);
    }

    log () {
        this.logger.module.log.apply(this.logger.module, arguments);
    }
};