'use strict';

const Base = require('../base/Base');

module.exports = class Store extends Base {

    load (cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    log () {
        this.rbac.log.apply(this.rbac, arguments);
    }

    createItems (items, cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    createRules (rules, cb) {
        cb(this.wrapClassMessage('Need to override'));
    }
};