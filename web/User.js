/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class User extends Base {

    constructor (config) {
        super({
            depends: ['cookie', 'session'],
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
                'httpOnly': true
            },
            authTimeout: null, // in seconds (depends on last user activity)
            absoluteAuthTimeout: null, // in seconds (depends on last login)
            ...config
        });
        if (!this.UserModel) {
            throw new Error(this.wrapClassMessage('User model is not set'));
        }
    }

    init () {
        this.module.addHandler('use', this.handleUser.bind(this));
    }

    handleUser (req, res, next) {
        res.locals.user = new this.WebUser({
            'req': req,
            'res': res,
            'next': next,
            'config': this,
            'module': res.locals.module,
            'session': req.session
        });
        // try to identify the user immediately, otherwise have to do a callback for isGuest and etc
        PromiseHelper.callback(res.locals.user.ensureIdentity(), next);
    }

    findUserModel (id) {
        return this.UserModel.findIdentity(id);
    }
};
module.exports.init();

const PromiseHelper = require('../helper/PromiseHelper');