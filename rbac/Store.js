'use strict';

const Base = require('../base/Base');

module.exports = class Store extends Base {

    load (cb) {
        cb(`${this.constructor.name}: Need to override`);
    }

    log () {
        this.rbac.log.apply(this.rbac, arguments);
    }
};