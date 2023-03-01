/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./ActionFilter');

module.exports = class AccessControl extends Base {

    /**
     * @param {Object} config
     * @param {Object[]} config.rules - Rule configurations
     * @param {function} config.deny - (action) => ...
     */
    constructor (config) {
        super({
            AccessRule,
            ...config
        });
    }

    getRules () {
        if (!this._rules) {
            this._rules = this.createRules();
        }
        return this._rules;
    }

    createRules () {
        const rules = [];
        for (const config of this.rules) {
            if (!config.Class) {
                config.Class = this.AccessRule;
            }
            rules.push(this.spawn(config));
        }
        return rules;
    }

    async beforeAction (action) {
        // check rules until the first result [allow or deny]
        for (const rule of this.getRules()) {
            const access = await rule.can(action);
            if (access === false) {
                return this.denyAccess(rule, action);
            }
            if (access === true) {
                return;
            }
        }
    }

    async denyAccess (rule, action) {
        if (rule.deny) {
            return rule.deny(action);
        }
        if (this.deny) {
            return this.deny(action);
        }
        throw new Forbidden;
    }
};

const AccessRule = require('./AccessRule');
const Forbidden = require('../error/http/Forbidden');