'use strict';

const Base = require('../base/Base');

module.exports = class Rule extends Base {

    execute (cb) {
        cb(null, false);
    }
};