'use strict';

const Base = require('../base/Base');

module.exports = class Inspector extends Base {

    init () {
        this._ruleCache = {};
    }

    execute (item, callback) {
        this.checkRule(item, (err, allowed)=> {
            if (err) {
                return callback(err);
            }
            if (!allowed) {
                return callback();
            }
            if (item === this.assignment) {
                return callback(null, true);
            }
            if (!item.parents || !item.parents.length) {
                return callback();
            }
            async.eachSeries(item.parents, (parent, cb)=> {
                this.execute(parent, (err, access)=> {
                    err ? callback(err) : access ? callback(null, true) : cb();
                });
            }, callback);
        });
    }

    checkRule (item, cb) {
        if (!item.rule) {
            return cb(null, true);
        }
        if (Object.prototype.hasOwnProperty.call(this._ruleCache, item.rule.id)) {
            return cb(null, this._ruleCache[item.rule.id]);
        }
        item.rule.execute(this.user, (err, allowed)=> {
            if (err) {
                return cb(err);
            }
            this._ruleCache[item.rule.id] = !!allowed;
            cb(null, allowed);
        }, this.params);
    }
};

const async = require('async');