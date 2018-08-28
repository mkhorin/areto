'use strict';

const Base = require('../base/Behavior');

module.exports = class TimestampBehavior extends Base {

    constructor (config) {
        super(Object.assign({
            format: null, // 'YYYY-MM-DD HH:mm:ss';
            createdAttr: 'createdAt', // or false
            updatedAttr: 'updatedAt'
        }, config));

        this.assign(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
        this.assign(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
    }

    beforeInsert (event) {
        if (this.createdAttr) {
            this.owner.set(this.createdAttr, this.formatDate());
        }
        this.beforeUpdate(event);
    }

    beforeUpdate (event) {
        if (this.updatedAttr) {
            this.owner.set(this.updatedAttr, this.formatDate());
        }
    }

    formatDate () {
        return this.format 
            ? moment().format(this.format) 
            : new Date;
    }
};

const moment = require('moment');
const ActiveRecord = require('../db/ActiveRecord');