'use strict';

const Base = require('../base/Base');

module.exports = class Store extends Base {

    load (cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    createItems (items, cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    createRules (rules, cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.rbac);
    }
};

const CommonHelper = require('../helper/CommonHelper');