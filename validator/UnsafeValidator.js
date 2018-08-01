'use strict';

const Base = require('./Validator');

module.exports = class UnsafeValidator extends Base {

    validateAttr (model, attr, cb) {
        cb();
    }
};