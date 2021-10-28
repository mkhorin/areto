/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class Auth extends Base {

    static getConstants () {
        return {
            EVENT_BEFORE_LOGIN: 'beforeLogin',
            EVENT_AFTER_LOGIN: 'afterLogin',
            EVENT_BEFORE_LOGOUT: 'beforeLogout',
            EVENT_AFTER_LOGOUT: 'afterLogout'
        };
    }

    /**
     * @param {Object} config
     * @param {number} config.timeout - In seconds (depends on last user activity)
     * @param {number} config.absoluteTimeout - In seconds (depends on last login)
     * @param {Object} config.identityCookie - Cookie options
     */
    constructor (config) {
        super({
            depends: ['cookie', 'session'],
            autoRenewCookie: true,
            enableAutoLogin: false,
            enableSession: true,
            loginUrl: '',
            defaultAssignments: ['user'],
            guestAssignments: ['guest'],
            timeout: null,
            absoluteTimeout: null,
            rbac: 'rbac',
            timeoutParam: '__expire',
            absoluteTimeoutParam: '__absoluteExpire',
            identityCookieParam: '__identity',
            idParam: '__id',
            returnUrlParam: '__returnUrl',
            csrf: true,
            csrfParam: '__csrf',
            csrfLength: 16,
            Identity: null, // user model
            WebUser: require('./WebUser'),
            ...config
        });
    }

    init () {
        this.identityCookie = Object.assign(this.getDefaultCookieOptions(), this.identityCookie);
        this.rbac = this.module.get(this.rbac);
        this.module.addHandler('use', this.createUser.bind(this));
    }

    getDefaultCookieOptions () {
        return {
            httpOnly: true,
            sameSite: 'strict'
        };
    }

    createUser (req, res, next) {
        res.locals.user = new this.WebUser({
            auth: this,
            module: res.locals.module,
            req, res
        });
        this.resolveUser(res.locals.user).then(next, next);
    }

    resolveUser (user) {
        return user.ensureIdentity();
    }

    // EVENTS

    beforeLogin (data) {
        // call await super.beforeLogin(data) if override it
        return this.trigger(this.EVENT_BEFORE_LOGIN, new Event(data));
    }

    afterLogin (data) {
        // call await super.afterLogin(data) if override it
        return this.trigger(this.EVENT_AFTER_LOGIN, new Event(data));
    }

    beforeLogout (data) {
        // call await super.beforeLogout(data) if override it
        return this.trigger(this.EVENT_BEFORE_LOGOUT, new Event(data));
    }

    afterLogout (data) {
        // call await super.afterLogout(data) if override it
        return this.trigger(this.EVENT_AFTER_LOGOUT, new Event(data));
    }

    // LOGIN

    async login (user, data) {
        await this.beforeLogin({user, ...data});
        await user.switchIdentity(data.identity, data.duration);
        await this.afterLogin({user, ...data});
    }

    async logout (user) {
        await this.beforeLogout({user});
        await user.switchIdentity(null);
        await this.afterLogout({user});
    }

    async loginByCookie (user) {
        const data = user.getCookie(this.identityCookieParam);
        if (!this.validateCookieData(data)) {
            return false;
        }
        const identity = await user.findIdentity(data.id).one();
        if (identity?.checkAuthKey(data.key)) {
            return this.login(user, {
                identity,
                duration: this.autoRenewCookie ? data.duration : 0,
                cookieBased: true
            });
        }
    }

    validateCookieData (data) {
        return data
            && typeof data.id === 'string'
            && typeof data.key === 'string'
            && typeof data.duration === 'number'
    }

    // RENEW

    async renew (user) {
        const id = user.getSession(this.idParam);
        const identity = id ? await user.findIdentity(id).one() : null;
        user.identity = identity;
        if (identity && this.renewTimeout(user) === false) {
            await this.logout(user);
        }
        if (this.enableAutoLogin) {
            if (user.isGuest()) {
                await this.loginByCookie(user);
            }
            if (this.autoRenewCookie) {
                this.renewCookie(user);
            }
        }
    }

    async renewTimeout (user) {
        if (this.timeout !== null || this.absoluteTimeout !== null) {
            const now = Math.floor(Date.now() / 1000);
            const expire = this.timeout !== null
                ? user.getSession(this.timeoutParam)
                : null;
            const absoluteExpire = this.absoluteTimeout !== null
                ? user.getSession(this.absoluteTimeoutParam)
                : null;
            if (expire !== null && expire < now || absoluteExpire !== null && absoluteExpire < now) {
                return false;
            }
            if (this.timeout !== null) {
                user.setSession(this.timeoutParam, now + this.timeout);
            }
        }
    }

    renewCookie (user) {
        const value = user.getCookie(this.identityCookieParam);
        if (value && typeof value.duration === 'number') {
            this.identityCookie.maxAge = value.duration * 1000;
            user.setCookie(this.identityCookieParam, value, this.identityCookie);
        }
    }

    renewIdentity (user, duration) {
        if (user.identity) {
            this.renewIdentitySession(user);
            if (duration > 0 && this.enableAutoLogin) {
                this.renewIdentityCookie(user, duration);
            }
        } else if (this.enableAutoLogin) {
            user.clearCookie(this.identityCookieParam, this.identityCookie);
        }
    }

    renewIdentitySession (user) {
        const now = Math.floor(Date.now() / 1000);
        user.setSession(this.idParam, user.getId());
        if (this.timeout !== null) {
            user.setSession(this.timeoutParam, now + this.timeout);
        }
        if (this.absoluteTimeout !== null) {
            user.setSession(this.absoluteTimeoutParam, now + this.absoluteTimeout);
        }
        if (this.csrf) {
            user.setSession(this.csrfParam, this.getCsrfToken());
        }
    }

    getCsrfToken () {
        return SecurityHelper.getRandomString(this.csrfLength);
    }

    renewIdentityCookie (user, duration) {
        this.identityCookie.maxAge = duration * 1000;
        user.setCookie(this.identityCookieParam, {
            id: user.getId(),
            key: user.getAuthKey(),
            duration
        }, this.identityCookie);
    }
};

const Event = require('../base/Event');
const SecurityHelper = require('../helper/SecurityHelper');