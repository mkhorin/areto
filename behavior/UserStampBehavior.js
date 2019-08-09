/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class UserStampBehavior extends Base {

    constructor (config) {
        super({
            creatorAttr: 'creator', // or false
            editorAttr: 'editor', // or false
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_INSERT, this.beforeInsert);
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
    }

    beforeInsert () {
        if (this.creatorAttr) {
            this.owner.set(this.creatorAttr, this.getUserId());
        }
        this.beforeUpdate();
    }

    beforeUpdate () {
        if (this.editorAttr) {
            this.owner.set(this.editorAttr, this.getUserId());
        }
    }

    getUserId () {
        return this.owner.user instanceof WebUser
            ? this.owner.user.getId()
            : null;
    }
};

const ActiveRecord = require('../db/ActiveRecord');
const WebUser = require('../security/WebUser');