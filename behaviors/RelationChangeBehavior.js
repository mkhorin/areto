'use strict';

const Base = require('../base/Behavior');

module.exports = class RelationChangeBehavior extends Base {

    init () {
        super.init();
        this.assign(ActiveRecord.EVENT_AFTER_VALIDATE, this.afterValidate);
        this.assign(ActiveRecord.EVENT_BEFORE_UPDATE, this.afterSave);
    }

    afterValidate (cb, event) {
        this._changes = {};
        for (let name of this.owner.getActiveRelationNames()) {
            this._changes[name] = this.owner.get(name);
            let relation = this.owner.getRelation(name);
            let value = this.owner.getOldAttr(name);
            if (!value && relation._viaArray && !relation._asBackRef) {
                value = [];
            }
            this.owner.set(name, value);
        }
        cb();
    }

    afterSave (cb, event) {
        AsyncHelper.eachSeries(this.owner.getActiveRelationNames(), this.changeRelation.bind(this), cb);
    }

    changeRelation (name, cb) {
        if (!this._changes || !this._changes[name]) {
            return cb();
        }
        let relation = this.owner.getRelation(name);
        let changes = this._changes[name];
        delete this._changes[name];
        AsyncHelper.series([
            cb => changes.removes instanceof Array && changes.removes.length
                ? relation.model.constructor.removeById(changes.removes, cb)
                : cb(),
            cb => changes.unlinks instanceof Array && changes.unlinks.length
                ? this.changeRelationById(changes.unlinks, relation, name, 'unlink', cb)
                : cb(),
            cb => changes.links instanceof Array && changes.links.length
                ? this.changeRelationById(changes.links, relation, name, 'link', cb)
                : cb(),
            cb => setImmediate(cb)
        ], cb);
    }

    changeRelationById (id, relation, name, action, cb) {
        AsyncHelper.waterfall([
            cb => relation.model.findById(id).all(cb),
            (targets, cb)=> AsyncHelper.eachSeries(targets, (target, cb)=> {
                relation._primaryModel[action](name, target, cb);
            }, cb)
        ], cb);
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');
const ActiveRecord = require('../db/ActiveRecord');