'use strict';

const Base = require('../base/Component');
const async = require('async');

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
        if ((!this.actions || this.actions.includes(action.id))
            && (!this.verbs || this.verbs.includes(action.controller.req.method))
            && (!this.controllers || this.controllers.includes(action.controller.ID))) {

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
        } else cb(); // skip rule
    }

    match (user, cb) {
        if (this.roles instanceof Array) {
            let roles = [];
            for (let item of this.roles) {
                if (item === '?') {
                    return cb(null, !user.isGuest());
                } else if (item === '@') {
                    return cb(null, user.isGuest());
                } else {
                    roles.push(item);
                }
            }
            async.eachSeries(roles, (item, cb2)=> {
                user.can(item, (err, access)=> {
                    err ? cb2(err) : access ? cb(null, true) : cb2();
                });
            }, err => cb(err, false));
        } else {
            cb();
        }
    }
};