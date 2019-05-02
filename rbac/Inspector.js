/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Inspector extends Base {

    constructor (config) {
        super(config);
        this._ruleCache = {};
    }

    async execute (item) {
        if (!item.rule || await this.checkRule(item.rule)) {
            return this.checkItem(item);
        }
    }

    async checkItem (item) {
        if (item === this.assignment) {
            return true;
        }
        if (item.parents && item.parents.length) {
            for (let parentItem of item.parents) {
                if (await this.execute(parentItem)) {
                    return true;
                }
            }
        }
    }

    async checkRule (rule) {
        if (Object.prototype.hasOwnProperty.call(this._ruleCache, rule.name)) {
            return this._ruleCache[rule.name];
        }
        let model = new rule.Class({
            ...rule,
            'inspector': this,
            'module': this.module
        });
        model.params = rule.params
            ? {...rule.params, ...this.params}
            : this.params;
        let passed = await model.execute();
        if (rule.name) {
            this._ruleCache[rule.name] = !!passed;
        }
        return passed;
    }

    getCachedRule (name) {
        return this._ruleCache[name] instanceof Rule ? this._ruleCache[name] : null;
    }
};

const Rule = require('./Rule');