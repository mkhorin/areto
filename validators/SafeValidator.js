'use strict';

const Base = require('./Validator');

module.exports = class SafeValidator extends Base {

    validateAttr (model, attr, cb) {
        cb();
    }
};