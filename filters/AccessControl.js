'use strict';

const Base = require('./ActionFilter');

module.exports = class AccessControl extends Base {

    constructor (config) {
        super(Object.assign({
            denyCallback: null,
            rules: [],
            AccessRule: require('./AccessRule')
        }, config));
    }

    init () {
        super.init();
        this.initRules();
    }

    initRules () {
        for (let i = 0; i < this.rules.length; ++i) {
            if (!(this.rules[i] instanceof this.AccessRule)) {
                let RuleClass = this.rules[i].Class || this.AccessRule;
                this.rules[i] = new RuleClass(this.rules[i]);
            }
        }
    }

    beforeAction (action, cb) {        
        let user = action.controller.user;
        // check rules before the first result - allow or deny
        AsyncHelper.eachSeries(this.rules, (rule, ruleCallback)=> {
            rule.can(action, user, (err, access)=> {                
                if (err) {
                    return cb(err);
                }
                if (access === true) {
                    return cb();
                }
                if (access !== false) {
                    return ruleCallback();
                }
                this.denyCallback
                    ? this.denyCallback(action, user, cb)
                    : this.denyAccess(action, user, cb);
            });
        }, cb);
    }

    denyAccess (action, user, cb) {
        user.isAnonymous()
            ? user.loginRequired()
            : cb(new ForbiddenHttpException);
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');
const CommonHelper = require('../helpers/CommonHelper');
const ForbiddenHttpException = require('../errors/ForbiddenHttpException');