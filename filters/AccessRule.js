'use strict';

const Base = require('../base/Component');

module.exports = class AccessRule extends Base {

    constructor (config) {
        super(Object.assign({
            allow: true, // allow or deny rule result
            // actions: ['update'],
            // controllers: ['article'],
            // roles: ['?', '@', 'reader'], // RBAC items
            // verbs: ['GET', 'POST'],
            // denyCallback: // TODO
        }, config));
    }

    can (action, user, cb) {
        if ((this.actions && !this.actions.includes(action.name))
            || (this.verbs && !this.verbs.includes(action.controller.req.method))
            || (this.controllers && !this.controllers.includes(action.controller.NAME))) {
            return cb(); // skip rule
        }
        this.match(user, (err, access)=> {
            if (err) {
                return cb(err);
            }
            if (access === true) {
                return cb(null, this.allow);
            }
            if (access === false) {
                return cb(null, !this.allow);
            }
            cb(); // skip rule
        });
    }

    match (user, cb) {
        if (!(this.roles instanceof Array)) {
            return cb();
        }
        let roles = [];
        for (let item of this.roles) {
            if (item === '?') {
                return cb(null, user.isAnonymous());
            }
            if (item === '@') {
                return cb(null, !user.isAnonymous());
            }
            roles.push(item);
        }
        AsyncHelper.eachSeries(roles, (item, roleCallback)=> {
            user.can(item, (err, access)=> {
                err ? roleCallback(err)
                    : access ? cb(null, true) : roleCallback();
            });
        }, err => cb(err, false));
    }
};

const AsyncHelper = require('../helpers/AsyncHelper');