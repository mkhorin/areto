'use strict';

let Base = require('./Validator');

module.exports = class SafeValidator extends Base {

    validateAttr (model, attr, cb) {
        cb();
    }
};