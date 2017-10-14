'use strict';

const Base = require('../base/Base');

module.exports = class Rule extends Base {

    execute (user, cb, params) {
        cb(null, true);
    }

    getModel (fileName) {
        return null;
    }
};