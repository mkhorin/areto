'use strict';

let Base = require('../base/Component');
let async = require('async');

module.exports = class Migration extends Base {

    init () {
        super.init();
        this.db = this.db || this.module.components.db;
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