'use strict';

const Base = require('../base/Component');

module.exports = class AccessRule extends Base {

    constructor (config) {
        super(Object.assign({
            allow: true, // allow or deny rule result
            // actions: ['update'],
            // controllers: ['article'],
            // roles: ['?', '@', 'reader'],
            // verbs: ['GET', 'POST'],
            // denyCallback: // TODO
        }, config));
    }

    can (action, user, cb) {
        if ((this.actions && !this.actions.includes(action.id))
            || (this.verbs && !this.verbs.includes(action.controller.req.method))
            || (this.controllers && !this.controllers.includes(action.controller.ID))) {
            return cb(); // skip rule
        }
        this.match(user, (err, access)=> {
            if (err) {
                cb(err);
            } else if (access === true) {
                cb(null, this.allow);
            } else if (access === false) {
                cb(null, !this.allow);
            } else {
                cb(); // skip rule
            }
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
            } else if (item === '@') {
                return cb(null, !user.isAnonymous());
            } else {
                roles.push(item);
            }
        }
        async.eachSeries(roles, (item, roleCallback)=> {
            user.can(item, (err, access)=> {
                err ? roleCallback(err)
                    : access ? cb(null, true) : roleCallback();
            });
        }, err => cb(err, false));
    }
};

const async = require('async');