'use strict';

let Base = require('../base/Behavior');
let moment = require('moment');

module.exports = class Timestamp extends Base {

    constructor (config) {
        super(Object.assign({
            format: null, // 'YYYY-MM-DD HH:mm:ss';
            createdAttr: 'createdAt', // or false
            updatedAttr: 'updatedAt'
        }, config));
    }

    init () {
        super.init();
        this._events[ActiveRecord.EVENT_BEFORE_INSERT] = 'beforeInsert';
        this._events[ActiveRecord.EVENT_BEFORE_UPDATE] = 'beforeUpdate';
    }

    beforeInsert (event, cb) {
        if (this.createdAttr) {
            this.owner.set(this.createdAttr, this.formatDate());
        }
        this.beforeUpdate(event, cb);
    }

    beforeUpdate (event, cb) {
        if (this.updatedAttr) {
            this.owner.set(this.updatedAttr, this.formatDate());
        }
        cb();
    }

    formatDate () {
        return this.format ? moment().format(this.format) : new Date;
    }
};

let ActiveRecord = require('../db/ActiveRecord');