/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Behavior');

module.exports = class DataHistoryBehavior extends Base {

    /**
     * @param {Object} config
     * @param {class} config.Model - ActiveRecord class
     * @param {string[]} config.includes - Tracked attribute names
     * @param {string[]} config.excludes - Not tracked attribute names
     * @param {Object} config.themeSet - Theme set instance
     */
    constructor (config) {
        super({
            Model: null,
            includes: null,
            excludes: null,
            ...config
        });
        this.setHandler(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
        this.setHandler(ActiveRecord.EVENT_AFTER_DELETE, this.afterDelete);
    }

    async beforeUpdate () {
        for (const name of this.getAttrNames()) {
            if (this.owner.isAttrChanged(name)) {
                await this.createHistory(name);
            }
        }
    }

    async createHistory (attr) {
        const model = ClassHelper.spawn(this.Model);
        model.setTargetData(this.owner, attr);
        await model.save();
        if (model.hasError()) {
            this.log('error', 'Model has errors', model.getErrors());
        }
    }

    afterDelete () {
        // delete all target object history
        return this.Model.deleteTargetAll(this.owner);
    }

    getAttrNames () {
        if (Array.isArray(this.includes)) {
            return this.includes;
        }
        if (Array.isArray(this.excludes)) {
            return ArrayHelper.exclude(this.excludes, this.owner.ATTRS);
        }
        return [];
    }

    hasAttr (name) {
        return this.getAttrNames().includes(name);
    }
};

const ArrayHelper = require('../helper/ArrayHelper');
const ClassHelper = require('../helper/ClassHelper');
const ActiveRecord = require('../db/ActiveRecord');