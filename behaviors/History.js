'use strict';

let Base = require('../base/Behavior');
let arrayHelper = require('../helpers/array');
let async = require('async');

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
        async.each(this.getAttributeNames(), (attr, cb)=> {
            if (this.owner.isAttributeChanged(attr)) {
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

    getAttributeNames () {
        return this.includes instanceof Array
            ? this.includes
            : this.excludes instanceof Array 
                ? arrayHelper.diff(this.owner.STORED_ATTRIBUTES, this.excludes) : [];
    }

    hasAttribute (name) {
        return this.getAttributeNames().includes(name);
    }
};

let ActiveRecord = require('../db/ActiveRecord');