/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./ActionFilter');

module.exports = class AccessControl extends Base {

    constructor (config) {
        super({
            // rules: [] rule configs
            // deny: [fn(action, user)]
            AccessRule,
            ...config
        });
        this.createRules();
    }

    createRules () {
        let rules = [];
        for (let rule of this.rules) {
            if (!(rule instanceof AccessRule)) {
                rule = this.spawn(rule.Class || this.AccessRule, rule);
            }
            rules.push(rule);
        }
        this.rules = rules;
    }

    async beforeAction (action, complete) {
        let user = action.controller.user;
        // check rules before the first result - allow or deny
        for (let rule of this.rules) {
            let access = await rule.can(action, user);
            if (access === false) {
                return this.denyAccess(rule, action, user);
            }
            if (access === true) {
                return;
            }
        }
    }

    async denyAccess (rule, action, user) {
        if (rule.deny) {
            return rule.deny(action, user);
        }
        if (this.deny) {
            return this.deny(action, user);
        }
        throw new Forbidden;
    }
};

const AccessRule = require('./AccessRule');
const Forbidden = require('../error/ForbiddenHttpException');