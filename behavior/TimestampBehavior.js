/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class TimestampBehavior extends Base {

    /**
     * @param {Object} config
     * @param {string} config.format - Timestamp format: YY-MM-DD HH:mm:ss
     * @param {string} config.creatorAttr - Null to skip
     * @param {string} config.editorAttr - Null to skip
     */
    constructor (config) {
        super({
            createdAttr: 'createdAt',
            updatedAttr: 'updatedAt',
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
    }

    beforeInsert () {
        if (this.createdAttr) {
            this.owner.set(this.createdAttr, this.formatDate());
        }
        this.beforeUpdate(...arguments);
    }

    beforeUpdate () {
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