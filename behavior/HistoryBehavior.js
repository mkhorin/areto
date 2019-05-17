/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class HistoryBehavior extends Base {

    constructor (config) {
        super({
            History: null, // history ActiveRecord
            includes: null, // [] tracked attr names
            excludes: null, // [] tracked attr names
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
        this.setHandler(ActiveRecord.EVENT_AFTER_REMOVE, this.afterRemove);
    }

    async beforeUpdate (event) {
        for (let name of this.getAttrNames()) {
            if (this.owner.isChangedAttr(name)) {
                await this.createHistory(name);
            }
        }
    }

    async createHistory (attr) {
        let model = ClassHelper.spawn(this.History);
        model.setTargetData(this.owner, attr);
        await model.save();
        if (model.hasError()) {
            this.log('error', 'Model has errors', model.getErrors());
        }
    }

    afterRemove (event) {
        // remove all target object history
        return this.History.removeTargetAll(this.owner);
    }

    getAttrNames () {
        return Array.isArray(this.includes)
            ? this.includes
            : Array.isArray(this.excludes) 
                ? ArrayHelper.diff(this.owner.ATTRS, this.excludes)
                : [];
    }

    hasAttr (name) {
        return this.getAttrNames().includes(name);
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const ClassHelper = require('../helper/ClassHelper');
const ActiveRecord = require('../db/ActiveRecord');