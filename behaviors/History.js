'use strict';

const Base = require('../base/Behavior');
const arrayHelper = require('../helpers/ArrayHelper');
const async = require('async');

module.exports = class History extends Base {

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
        this._events[ActiveRecord.EVENT_AFTER_DELETE] = 'afterDelete';
    }

    beforeUpdate (event, cb) {
        async.each(this.getAttrNames(), (attr, cb)=> {
            if (this.owner.isAttrChanged(attr)) {
                let model = new this.ModelClass;
                model.setTargetData(this.owner, attr);
                model.save(err => {
                    err && model.module.log('error', 'History behavior:', model.getErrors());
                    cb();
                });
            } else cb();
        }, cb)
    }

    afterDelete (event, cb) {
        // remove all target object history
        this.ModelClass.removeTargetAll(this.owner, cb);
    }

    getAttrNames () {
        return this.includes instanceof Array
            ? this.includes
            : this.excludes instanceof Array 
                ? arrayHelper.diff(this.owner.STORED_ATTRIBUTES, this.excludes) : [];
    }

    hasAttr (name) {
        return this.getAttrNames().includes(name);
    }
};

const ActiveRecord = require('../db/ActiveRecord');