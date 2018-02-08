'use strict';

const Base = require('../base/Component');

module.exports = class User extends Base {

    static getConstants () {
        return {
            DEFAULTS: {
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
            },
            EVENT_BEFORE_LOGIN: 'beforeLogin',
            EVENT_AFTER_LOGIN: 'afterLogin',
            EVENT_BEFORE_LOGOUT: 'beforeLogout',
            EVENT_AFTER_LOGOUT: 'afterLogout'
        };
    }

    constructor (req, res, next, params) {
        super({
            req, 
            res, 
            next, 
            params,
            session: req.session
        });
    }

    init () {
        super.init();                                                     
        if (!this.params.Identity) {
            throw new Error(`${this.constructor.name}: Identity is not set`);
        }
        if (this.params.enableAutoLogin && !this.params.identityCookieParam) {
            throw new Error(`${this.constructor.name}: identityCookieParam is not set`);
        }
        this._accessCache = {};
    }

    getTitle (defaultValue) {
        return this.identity ? this.identity.getTitle() : defaultValue === undefined ? '' : defaultValue;
    }

    // LOGIN

    isAnonymous () {
        return this.identity === null;
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
        url = this.session[this.params.returnUrlParam] || url || this.params.returnUrl;
        return url || this.getLocalModule().getHomeUrl();
    }

    setReturnUrl (url) {
        this.session[this.params.returnUrlParam] = url;
    }

    getLoginUrl () {
        return this.params.loginUrl;
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
        let value = this.req.cookies[this.params.identityCookieParam];
        if (!value || typeof value !== 'object'
            || typeof value.id !== 'string'
            || typeof value.key !== 'string'
            || typeof value.duration !== 'number') {
            return cb();
        }
        let duration = value.duration;
        AsyncHelper.waterfall([
            cb => this.params.Identity.findIdentity(value.id).one(cb),
            (identity, cb)=> {
                if (!identity || !identity.validateAuthKey(value.key)) {
                    return cb();
                }
                AsyncHelper.series([
                    cb => this.beforeLogin(identity, true, duration, cb),
                    cb => this.switchIdentity(identity, this.params.autoRenewCookie ? duration : 0, cb),
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
        if (this.params.enableSession) {
            this.setReturnUrl(this.req.originalUrl);
        }
        this.params.loginUrl && !this.req.xhr
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
        this.params.enableSession && autoRenew
            ? this.renewAuthStatus(()=> this.setAssignments(cb))
            : cb();
    }

    setIdentity (identity) {
        this.identity = identity;
    }

    switchIdentity (identity, duration, cb) {
        this.setIdentity(identity);
        if (!this.params.enableSession) {
            return cb();
        }
        let returnUrl = this.getReturnUrl();
        // created new session instance
        this.session.regenerate(()=> {
            this.session = this.req.session;
            this.setReturnUrl(returnUrl);
            if (identity) {
                let now = Math.floor((new Date).getTime() / 1000);
                this.session[this.params.idParam] = this.getId();
                if (this.params.authTimeout !== null) {
                    this.session[this.params.authTimeoutParam] = now + this.params.authTimeout;
                }
                if (this.params.absoluteAuthTimeout !== null) {
                    this.session[this.params.absoluteAuthTimeoutParam] = now + this.params.absoluteAuthTimeout;
                }
                if (this.assignments) {
                    this.session[this.params.assignmentsParam] = this.assignments;
                }
                if (duration > 0 && this.params.enableAutoLogin) {
                    this.sendIdentityCookie(identity, duration);
                }
            } else if (this.params.enableAutoLogin) {
                this.res.clearCookie(this.params.identityCookieParam, this.params.identityCookie);
            }
            cb();
        });
    }

    sendIdentityCookie (identity, duration) {
        this.params.identityCookie.maxAge = duration * 1000;
        this.res.cookie(this.params.identityCookieParam, {
            id: identity.getId(),
            key: identity.getAuthKey(),
            duration
        }, this.params.identityCookie);
    }

    // RENEW AUTH

    renewAuthStatus (cb) {
        let id = this.session[this.params.idParam];
        if (!id) {
            return this.renewAuthExpire(null, cb);
        }
        AsyncHelper.waterfall([
            cb => this.params.Identity.findIdentity(id).one(cb),
            this.renewAuthExpire.bind(this)
        ], cb);
    }

    renewAuthExpire (identity, cb) {
        this.setIdentity(identity);
        if (identity && (this.params.authTimeout !== null || this.params.absoluteAuthTimeout !== null)) {
            let now = Math.floor((new Date).getTime() / 1000);
            let expire = this.params.authTimeout !== null
                ? this.session[this.params.authTimeoutParam]
                : null;
            let expireAbsolute = this.params.absoluteAuthTimeout !== null
                ? this.session[this.params.absoluteAuthTimeoutParam]
                : null;
            if (expire !== null && expire < now || expireAbsolute !== null && expireAbsolute < now) {
                return this.logout(()=> this.renewAuthCookie(cb), false);
            }
            if (this.params.authTimeout !== null) {
                this.session[this.params.authTimeoutParam] = now + this.params.authTimeout;
            }
        }
        this.renewAuthCookie(cb);
    }

    renewAuthCookie (cb) {
        if (this.params.enableAutoLogin) {
            if (this.isAnonymous()) {
                return this.loginByCookie(cb);
            }
            if (this.params.autoRenewCookie) {
                this.renewIdentityCookie();
            }
        }
        cb();
    }

    renewIdentityCookie () {
        let value = this.req.cookies[this.params.identityCookieParam];
        if (value && typeof value.duration === 'number') {
            this.params.identityCookie.maxAge = value.duration * 1000;
            this.res.cookie(this.params.identityCookieParam, value, this.params.identityCookie);
        }
    }

    // RBAC

    setAssignments (cb) {
        if (!this.getLocalModule().components.rbac) {
            return cb();
        }
        if (!this.identity) {
            this.assignments = this.params.anonymousAssignments || [];
            return cb();
        }
        this.identity.getAssignments((err, result)=> {
            if (err) {
                return cb(err);
            }
            this.assignments = result || this.params.defaultAssignments || [];
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
            module: this.getLocalModule(),
            user: this.identity
        }, params);
        params.module.components.rbac.can(this.assignments, name, (err, access)=> {
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
const ServerErrorHttpException = require('../errors/ServerErrorHttpException');
const Url = require('./Url');