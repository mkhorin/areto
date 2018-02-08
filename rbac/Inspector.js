'use strict';

const Base = require('../base/Base');

module.exports = class Inspector extends Base {

    init () {
        this._ruleCache = {};
    }

    execute (item, cb) {
        if (!item.rule) {
            return this.checkItem(item, cb);
        }
        this.checkRule(item.rule, (err, allowed)=> {
            err ? cb(err) : allowed ? this.checkItem(item, cb) : cb();
        });
    }

    checkItem (item, cb) {
        if (item === this.assignment) {
            return cb(null, true);
        }
        if (!item.parents || !item.parents.length) {
            return cb();
        }
        AsyncHelper.someSeries(item.parents, this.execute.bind(this), cb);
    }

    checkRule (rule, cb) {
        if (rule.name && Object.prototype.hasOwnProperty.call(this._ruleCache, rule.name)) {
            return cb(null, this._ruleCache[rule.name]);
        }
        rule.inspector = this;
        (new rule.Class(rule)).execute((err, allowed)=> {
            if (err) {
                return cb(err);
            }
            if (rule.name) {
                this._ruleCache[rule.name] = !!allowed;
            }
            cb(null, allowed);
        });
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');