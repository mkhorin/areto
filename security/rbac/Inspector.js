/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Inspector extends Base {

    _ruleCache = {};

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
            for (const parentItem of item.parents) {
                if (await this.execute(parentItem)) {
                    return true;
                }
            }
        }
    }

    async checkRule (config) {
        if (Object.prototype.hasOwnProperty.call(this._ruleCache, config.name)) {
            return this._ruleCache[config.name];
        }
        const rule = new config.Class({
            ...config,
            inspector: this,
            module: this.module
        });
        rule.params = config.params ? {...config.params, ...this.params} : this.params;
        const passed = await rule.execute();
        if (config.name) {
            this._ruleCache[config.name] = !!passed;
        }
        return passed;
    }

    getCachedRule (name) {
        return this._ruleCache[name] instanceof Rule ? this._ruleCache[name] : null;
    }
};

const Rule = require('./Rule');