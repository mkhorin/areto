'use strict';

const Base = require('../base/Behavior');

module.exports = class HistoryBehavior extends Base {

    constructor (config) {
        super(Object.assign({
            History: null, // history ActiveRecord
            includes: null, // [] tracked attr names
            excludes: null // [] tracked attr names
        }, config));
    }

    init () {
        super.init();
        this.assign(ActiveRecord.EVENT_BEFORE_UPDATE, this.beforeUpdate);
        this.assign(ActiveRecord.EVENT_AFTER_REMOVE, this.afterRemove);
    }

    beforeUpdate (cb, event) {
        AsyncHelper.eachSeries(this.getAttrNames(), (attr, cb)=> {
            this.owner.isAttrChanged(attr) 
                ? this.createHistory(attr, cb) 
                : cb();
        }, cb);
    }

    createHistory (attr, cb) {
        let model = new this.History;
        model.setTargetData(this.owner, attr);
        AsyncHelper.series([
            cb => model.save(cb),
            cb => {
                if (model.hasError()) {
                    this.owner.log('error', this.constructor.name, model.getErrors());
                }
                cb();
            }
        ], cb);
    }

    afterRemove (cb, event) {
        // remove all target object history
        this.History.removeTargetAll(this.owner, cb);
    }

    getAttrNames () {
        return this.includes instanceof Array
            ? this.includes
            : this.excludes instanceof Array 
                ? ArrayHelper.diff(this.owner.STORED_ATTRS, this.excludes)
                : [];
    }

    hasAttr (name) {
        return this.getAttrNames().includes(name);
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');
const ArrayHelper = require('../helpers/ArrayHelper');
const ActiveRecord = require('../db/ActiveRecord');