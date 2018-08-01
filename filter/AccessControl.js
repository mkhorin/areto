'use strict';

const Base = require('./ActionFilter');

module.exports = class AccessControl extends Base {

    constructor (config) {
        super(Object.assign({
            // rules: [] rule configs
            // denyCallback: function (action, user, cb)
            AccessRule
        }, config));
    }

    init () {
        super.init();
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

    beforeAction (action, complete) {
        let user = action.controller.user;
        // check rules before the first result - allow or deny
        AsyncHelper.eachSeries(this.rules, (rule, cb)=> {
            rule.can(action, user, (err, access)=> {                
                if (err) {
                    return complete(err);
                }
                if (access === true) {
                    return complete();
                }
                if (access !== false) {
                    return cb(); // check next rule
                }
                this.denyAccess(rule, action, user, complete);
            });
        }, complete);
    }

    denyAccess (rule, action, user, cb) {
        if (rule.denyCallback) {
            return rule.denyCallback(action, user, cb);
        }
        if (this.denyCallback) {
            this.denyCallback(action, user, cb);
        }
        user.isGuest()
            ? user.loginRequired()
            : cb(new ForbiddenHttpException);
    }
};

const AsyncHelper = require('../helper/AsyncHelper');
const AccessRule = require('./AccessRule');
const ForbiddenHttpException = require('../error/ForbiddenHttpException');