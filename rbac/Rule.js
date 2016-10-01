'use strict';

let Base = require('../base/Base');

module.exports = class Rule extends Base {

    execute (user, cb, params) {
        cb(null, true);
    }
};