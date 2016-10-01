'use strict';

let Base = require('./ActionFilter');
let helper = require('../helpers/main');
let async = require('async');

module.exports = class AccessControl extends Base {

    constructor (config) {
        super(Object.assign({
            denyCallback: null,
            rules: []
        }, config));
    }

    init () {
        super.init();
        for (let i = 0; i < this.rules.length; ++i) {
            if (!(this.rules[i] instanceof AccessRule)) {
                let RuleClass = this.rules[i].Class || AccessRule;
                this.rules[i] = new RuleClass(this.rules[i]);
            }
        }
    }

    beforeAction (action, cb) {        
        let user = action.controller.user;
        // check rules before the first result - allow or deny
        async.eachSeries(this.rules, (rule, cb2)=> {
            rule.can(action, user, (err, access)=> {                
                if (err) {
                    cb(err);
                } else if (access === true) {
                    cb();
                } else if (access === false) {
                    this.denyCallback
                        ? this.denyCallback(action, user, cb)
                        : this.denyAccess(action, user, cb);
                } else {
                    cb2();
                }
            });
        }, cb);
    }

    denyAccess (action, user, cb) {
        let Exception = require('../errors/ForbiddenHttpException');
        user.isGuest() ? user.loginRequired() : cb(new Exception);
    }
};

let AccessRule = require('./AccessRule');