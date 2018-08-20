'use strict';

const Base = require('../base/Behavior');

module.exports = class UserStampBehavior extends Base {

    constructor (config) {
        super(Object.assign({
            format: null, // 'YYYY-MM-DD HH:mm:ss';
            creatorAttr: 'creator', // or false
            editordAttr: 'editor'
        }, config));

        this.assign(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
        this.assign(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
    }

    beforeInsert (cb, event) {
        if (this.creatorAttr) {
            this.owner.set(this.creatorAttr, this.getUserId());
        }
        this.beforeUpdate(cb, event);
    }

    beforeUpdate (cb, event) {
        if (this.editordAttr) {
            this.owner.set(this.editordAttr, this.getUserId());
        }
        cb();
    }

    getUserId () {
        return this.owner.user instanceof WebUser
            ? this.owner.user.getId()
            : null;
    }
};

const ActiveRecord = require('../db/ActiveRecord');
const WebUser = require('../web/WebUser');