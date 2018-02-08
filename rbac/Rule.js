'use strict';

const Base = require('../base/Base');

module.exports = class Rule extends Base {

    init () {
        this.params = this.inspector.params;
    }

    execute (cb) {
        cb(null, false);
    }
};