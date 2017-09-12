'use strict';

const Base = require('../base/Behavior');
const arrayHelper = require('../helpers/ArrayHelper');
const async = require('async');

module.exports = class HistoryBehavior extends Base {

    constructor (config) {
        super(Object.assign({
            ModelClass: null, // history ActiveRecord
            includes: null, // [] tracked attr names
            excludes: null // [] tracked attr names
        }, config));
    }

    init () {
        super.init();
        this._events[ActiveRecord.EVENT_BEFORE_UPDATE] = 'beforeUpdate';
        this._events[ActiveRecord.EVENT_AFTER_REMOVE] = 'afterRemove';
    }

    beforeUpdate (event, cb) {
        async.each(this.getAttrNames(), (attr, cb)=> {
            if (!this.owner.isAttrChanged(attr)) {
                 return cb();
            }
            let model = new this.ModelClass;
            model.setTargetData(this.owner, attr);
            model.save(err => {
                err && model.module.log('error', 'HistoryBehavior:', model.getErrors());
                cb();
            });
        }, cb)
    }

    afterRemove (event, cb) {
        // remove all target object history
        this.ModelClass.removeTargetAll(this.owner, cb);
    }

    getAttrNames () {
        return this.includes instanceof Array
            ? this.includes
            : this.excludes instanceof Array 
                ? arrayHelper.diff(this.owner.STORED_ATTRS, this.excludes) : [];
    }

    hasAttr (name) {
        return this.getAttrNames().includes(name);
    }
};

const ActiveRecord = require('../db/ActiveRecord');