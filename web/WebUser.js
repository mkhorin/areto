'use strict';

const Base = require('../base/Component');

module.exports = class WebUser extends Base {

    static getConstants () {
        return {
            EVENT_BEFORE_LOGIN: 'beforeLogin',
            EVENT_AFTER_LOGIN: 'afterLogin',
            EVENT_BEFORE_LOGOUT: 'beforeLogout',
            EVENT_AFTER_LOGOUT: 'afterLogout'
        };
    }

    init () {
        super.init();
        this.session = this.req.session;
        this._accessCache = {};
    }

    getTitle (defaultValue) {
        return this.identity ? this.identity.getTitle() : defaultValue === undefined ? '' : defaultValue;
    }

    // LOGIN

    isAnonymous () {
        return !this.identity;
    }

    getLocalModule () {
        return this.res.locals.module;
    }

    getId () {
        return this.identity ? this.identity.getId() : null;
    }

    getIp () {
        return this.req.ip;
    }

    getReturnUrl (url) {
        url = this.session[this.owner.returnUrlParam] || url || this.owner.returnUrl;
        return url || this.getLocalModule().getHomeUrl();
    }

    setReturnUrl (url) {
        this.session[this.owner.returnUrlParam] = url;
    }

    getLoginUrl () {
        return this.owner.loginUrl;
    }

    login (identity, duration, cb) {
        duration = duration || 0;
        AsyncHelper.series([
            cb => this.beforeLogin(identity, false, duration, cb),
            cb => this.switchIdentity(identity, duration, cb),
            cb => this.afterLogin(identity, false, duration, cb)
        ], cb);
    }

    loginByCookie (cb) {
        let value = this.req.cookies[this.owner.identityCookieParam];
        if (!value || typeof value !== 'object'
            || typeof value.id !== 'string'
            || typeof value.key !== 'string'
            || typeof value.duration !== 'number') {
            return cb();
        }
        let duration = value.duration;
        AsyncHelper.waterfall([
            cb => this.owner.Identity.findIdentity(value.id).one(cb),
            (identity, cb)=> {
                if (!identity || !identity.validateAuthKey(value.key)) {
                    return cb();
                }
                AsyncHelper.series([
                    cb => this.beforeLogin(identity, true, duration, cb),
                    cb => this.switchIdentity(identity, this.owner.autoRenewCookie ? duration : 0, cb),
                    cb => this.afterLogin(identity, true, duration, cb)
                ], cb);
            }
        ], cb);
    }

    logout (cb, destroySession = true) {
        let identity = this.identity;
        identity ? AsyncHelper.series([
            cb => this.beforeLogout(identity, cb),
            cb => this.switchIdentity(null, 0, cb),
            cb => this.afterLogout(identity, cb)
        ], cb) : cb();
    }

    loginRequired () {
        if (this.owner.enableSession) {
            this.setReturnUrl(this.req.originalUrl);
        }
        this.owner.loginUrl && !this.req.xhr
            ? this.res.redirect(Url.create(this.getLoginUrl(), this.getLocalModule()))
            : this.next(new ForbiddenHttpException);
    }

    // EVENTS

    // if override this method call - super.beforeLogin
    beforeLogin (identity, cookieBased, duration, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGIN, cb, new Event({
            identity, cookieBased, duration
        }));
    }

    afterLogin (identity, cookieBased, duration, cb) {
        this.triggerCallback(this.EVENT_AFTER_LOGIN, cb, new Event({
            identity, cookieBased, duration
        }));
    }

    beforeLogout (identity, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGOUT, cb, new Event({identity}));
    }

    afterLogout (identity, cb) {
        this.triggerCallback(this.EVENT_AFTER_LOGOUT, cb, new Event({identity}));
    }

    // IDENTITY

    ensureIdentity (cb, autoRenew = true) {
        if (this.identity !== undefined) {
            return cb();
        }
        this.identity = null;
        this.owner.enableSession && autoRenew
            ? this.renewAuthStatus(()=> this.setAssignments(cb))
            : cb();
    }

    setIdentity (identity) {
        this.identity = identity;
    }

    switchIdentity (identity, duration, cb) {
        this.setIdentity(identity);
        if (!this.owner.enableSession) {
            return cb();
        }
        let returnUrl = this.getReturnUrl();
        // created new session instance
        this.session.regenerate(()=> {
            this.session = this.req.session;
            this.setReturnUrl(returnUrl);
            if (identity) {
                let now = Math.floor((new Date).getTime() / 1000);
                this.session[this.owner.idParam] = this.getId();
                if (this.owner.authTimeout !== null) {
                    this.session[this.owner.authTimeoutParam] = now + this.owner.authTimeout;
                }
                if (this.owner.absoluteAuthTimeout !== null) {
                    this.session[this.owner.absoluteAuthTimeoutParam] = now + this.owner.absoluteAuthTimeout;
                }
                if (this.assignments) {
                    this.session[this.owner.assignmentsParam] = this.assignments;
                }
                if (duration > 0 && this.owner.enableAutoLogin) {
                    this.sendIdentityCookie(identity, duration);
                }
            } else if (this.owner.enableAutoLogin) {
                this.res.clearCookie(this.owner.identityCookieParam, this.owner.identityCookie);
            }
            cb();
        });
    }

    sendIdentityCookie (identity, duration) {
        this.owner.identityCookie.maxAge = duration * 1000;
        this.res.cookie(this.owner.identityCookieParam, {
            id: identity.getId(),
            key: identity.getAuthKey(),
            duration
        }, this.owner.identityCookie);
    }

    // RENEW AUTH

    renewAuthStatus (cb) {
        let id = this.session[this.owner.idParam];
        if (!id) {
            return this.renewAuthExpire(null, cb);
        }
        AsyncHelper.waterfall([
            cb => this.owner.Identity.findIdentity(id).one(cb),
            this.renewAuthExpire.bind(this)
        ], cb);
    }

    renewAuthExpire (identity, cb) {
        this.setIdentity(identity);
        if (identity && (this.owner.authTimeout !== null || this.owner.absoluteAuthTimeout !== null)) {
            let now = Math.floor((new Date).getTime() / 1000);
            let expire = this.owner.authTimeout !== null
                ? this.session[this.owner.authTimeoutParam]
                : null;
            let expireAbsolute = this.owner.absoluteAuthTimeout !== null
                ? this.session[this.owner.absoluteAuthTimeoutParam]
                : null;
            if (expire !== null && expire < now || expireAbsolute !== null && expireAbsolute < now) {
                return this.logout(()=> this.renewAuthCookie(cb), false);
            }
            if (this.owner.authTimeout !== null) {
                this.session[this.owner.authTimeoutParam] = now + this.owner.authTimeout;
            }
        }
        this.renewAuthCookie(cb);
    }

    renewAuthCookie (cb) {
        if (this.owner.enableAutoLogin) {
            if (this.isAnonymous()) {
                return this.loginByCookie(cb);
            }
            if (this.owner.autoRenewCookie) {
                this.renewIdentityCookie();
            }
        }
        cb();
    }

    renewIdentityCookie () {
        let value = this.req.cookies[this.owner.identityCookieParam];
        if (value && typeof value.duration === 'number') {
            this.owner.identityCookie.maxAge = value.duration * 1000;
            this.res.cookie(this.owner.identityCookieParam, value, this.owner.identityCookie);
        }
    }

    // RBAC

    setAssignments (cb) {
        if (!this.getLocalModule().components.rbac) {
            return cb();
        }
        if (!this.identity) {
            this.assignments = this.owner.anonymousAssignments || [];
            return cb();
        }
        this.identity.getAssignments((err, result)=> {
            if (err) {
                return cb(err);
            }
            this.assignments = result || this.owner.defaultAssignments || [];
            cb();
        });
    }

    can (name, cb, params) {
        Object.prototype.hasOwnProperty.call(this._accessCache, name)
            ? cb(null, this._accessCache[name])
            : this.forceCan(name, cb, params);
    }

    forceCan (name, cb, params) {
        params = Object.assign({
            user: this
        }, params);
        this.getLocalModule().components.rbac.can(this.assignments, name, (err, access)=> {
            if (err) {
                return cb(err);
            }
            this._accessCache[name] = !!access;
            cb(null, access);
        }, params);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const Event = require('../base/Event');
const ForbiddenHttpException = require('../errors/ForbiddenHttpException');
const Url = require('./Url');