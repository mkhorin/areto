'use strict';

const Base = require('../base/Behavior');

module.exports = class RelationChangeBehavior extends Base {

    init () {
        super.init();
        this._events[ActiveRecord.EVENT_AFTER_VALIDATE] = 'afterValidate';
        this._events[ActiveRecord.EVENT_BEFORE_UPDATE] = 'afterSave';
    }

    afterValidate (event, cb) {
        this._changes = {};
        for (let name of this.owner.getActiveRelationNames()) {
            this._changes[name] = this.owner.get(name);
            let relation = this.owner.getRelation(name);
            let value = this.owner.getOldAttr(name);
            this.owner.set(name, !value && relation._viaArray && !relation._asBackRef ? [] : value);
        }
        cb();
    }

    afterSave (insert, cb) {
        async.eachSeries(this.owner.getActiveRelationNames(), this.changeRelation.bind(this), cb);
    }

    changeRelation (name, cb) {
        if (!this._changes || !this._changes[name]) {
            return cb();
        }
        let relation = this.owner.getRelation(name);
        let changes = this._changes[name];
        delete this._changes[name];
        async.series([
            cb => changes.removes instanceof Array && changes.removes.length
                ? relation.model.constructor.removeById(changes.removes, cb)
                : cb(),
            cb => changes.unlinks instanceof Array && changes.unlinks.length
                ? this.changeRelationById(changes.unlinks, relation, name, 'unlink', cb)
                : cb(),
            cb => changes.links instanceof Array && changes.links.length
                ? this.changeRelationById(changes.links, relation, name, 'link', cb)
                : cb()
        ], cb);
    }

    changeRelationById (id, relation, name, action, cb) {
        relation.model.findById(id).all((err, targets)=> {
            err ? cb(err) : async.eachSeries(targets, (target, cb)=> {
                relation._primaryModel[action](name, target, cb);
            }, cb);
        });
    }
};

const async = require('async');
const ActiveRecord = require('../db/ActiveRecord');