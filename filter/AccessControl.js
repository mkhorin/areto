'use strict';

const Base = require('./ActionFilter');

module.exports = class AccessControl extends Base {

    constructor (config) {
        super(Object.assign({
            // rules: [] rule configs
            // denyPromise: async (action, user)
            AccessRule
        }, config));
        
        this.createRules();
    }

    createRules () {
        this.rules = this.rules.map(rule => {
            if (rule instanceof AccessRule) {
                return rule;
            }
            let RuleClass = rule.Class || this.AccessRule;
            return new RuleClass(rule);
        });
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
        if (rule.denyPromise) {
            return rule.denyPromise(action, user);
        }
        if (this.denyPromise) {
            return this.denyPromise(action, user);
        }
        throw new ForbiddenHttpException;
    }
};

const AccessRule = require('./AccessRule');
const ForbiddenHttpException = require('../error/ForbiddenHttpException');