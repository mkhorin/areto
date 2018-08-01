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
        if (Object.prototype.hasOwnProperty.call(this._ruleCache, rule.name)) {
            return cb(null, this._ruleCache[rule.name]);
        }
        let model = new rule.Class(rule);
        model.params = rule.params ? Object.assign({}, rule.params, this.params) : this.params;
        model.execute((err, passed)=> {
            if (rule.name) {
                this._ruleCache[rule.name] = !!passed;
            }
            cb(err, passed);
        });
    }

    getCachedRule (name) {
        return this._ruleCache[name] instanceof Rule ? this._ruleCache[name] : null;
    }
};

const AsyncHelper = require('../helper/AsyncHelper');
const Rule = require('./Rule');