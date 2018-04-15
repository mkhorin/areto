'use strict';

const Base = require('../base/Component');

module.exports = class User extends Base {

    constructor (config) {
        super(Object.assign({
            WebUser: require('./WebUser'),
            Identity: null,
            enableSession: true,
            loginUrl: '',
            enableAutoLogin: false,
            autoRenewCookie: true,
            idParam: '__id',
            authTimeoutParam: '__expire',
            absoluteAuthTimeoutParam: '__absoluteExpire',
            returnUrlParam: '__returnUrl',
            identityCookieParam: '__identity',
            assignmentsParam: '__assignments',
            defaultAssignments: ['guest'],
            anonymousAssignments: ['anonymous'],
            identityCookie: {
                httpOnly: true
            },
            authTimeout: null, // in seconds (depends on last user activity)
            absoluteAuthTimeout: null // in seconds (depends on last login)
        }, config));
    }

    init () {
        super.init();                                                     
        if (!this.Identity) {
            throw new Error(this.wrapClassMessage('Identity is not set'));
        }
        if (this.enableAutoLogin && !this.identityCookieParam) {
            throw new Error(this.wrapClassMessage('identityCookieParam is not set'));
        }
    }

    createWebUser (req, res, next) {
        return new this.WebUser({req, res, next, owner: this});
    }

    createByData (data, cb) {
        AsyncHelper.eachSeries(data, (data, cb)=> {
            this.Identity.create(data, cb);
        }, cb);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');