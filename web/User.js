/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class User extends Base {

    constructor (config) {
        super(Object.assign({
            UserModel: null,
            WebUser: require('./WebUser'),
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
            defaultAssignments: ['user'],
            guestAssignments: ['guest'],
            identityCookie: {
                httpOnly: true
            },
            authTimeout: null, // in seconds (depends on last user activity)
            absoluteAuthTimeout: null // in seconds (depends on last login)
        }, config));

        if (!this.UserModel) {
            throw new Error(this.wrapClassMessage('User model is not set'));
        }
    }

    createWebUser (req, res, next) {
        return new this.WebUser({
            req,
            res,
            next,
            owner: this
        });
    }

    findUserModel (id) {
        return this.UserModel.findIdentity(id);
    }
};
module.exports.init();