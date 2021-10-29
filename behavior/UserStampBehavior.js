/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class UserStampBehavior extends Base {

    /**
     * @param {Object} config
     * @param {string} config.creatorAttr - Null to skip
     * @param {string} config.editorAttr - Null to skip
     */
    constructor (config) {
        super({
            creatorAttr: 'creator',
            editorAttr: 'editor',
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
        return this.owner.user?.getId();
    }
};

const ActiveRecord = require('../db/ActiveRecord');