'use strict';

const Base = require('../base/Component');
const async = require('async');

module.exports = class Migration extends Base {

    init () {
        super.init();
        this.db = this.db || this.module.getDb();
    }

    apply (cb) {
        this.execute(cb, []); // execute this migration
    }

    revert (cb) {
        cb(null, false); // false - migration cant be reverted
    }
    
    execute (cb, tasks) {
        async.series(tasks || [], cb);
    }
};