/**
 * @copyright Copyright (c) 2021 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Inspector extends Base {

    _ruleCache = {};

    execute (item) {
        return item.rules
            ? this.checkRuleItem(item)
            : this.checkItem(item);
    }

    async checkRuleItem (item) {
        if (await this.checkRules(item.rules)) {
            return this.checkItem(item);
        }
    }

    checkItem (item) {
        if (item === this.assignment) {
            return true;
        }
        if (item.parents) {
            return this.checkItems(item.parents);
        }
    }

    async checkItems (items) {
        for (const item of items) {
            if (await this.execute(item)) {
                return true;
            }
        }
    }

    async checkRules (rules) {
        for (const rule of rules) {
            const passed = await this.checkRule(rule);
            if (!passed) {
                return false;
            }
        }
        return true;
    }

    async checkRule (data) {
        if (Object.hasOwn(this._ruleCache, data.name)) {
            return this._ruleCache[data.name];
        }
        const passed = await this.executeRule(data) === true;
        if (data.name) {
            this._ruleCache[data.name] = passed;
        }
        return passed;
    }

    executeRule (data) {
        const rule = new data.Class({
            ...data,
            inspector: this,
            module: this.module
        });
        rule.params = data.params
            ? {...data.params, ...this.params}
            : this.params;
        return rule.execute();
    }

    log () {
        CommonHelper.log(this.rbac, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../../helper/CommonHelper');