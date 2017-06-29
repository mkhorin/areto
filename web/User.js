'use strict';

const Base = require('../base/Component');

module.exports = class User extends Base {

    static getConstants () {
        return {
            DEFAULTS: {
                Identity: null,
                enableSession: true,
                loginUrl: null,
                enableAutoLogin: false,
                autoRenewCookie: true,
                idParam: '__id',
                authTimeoutParam: '__expire',
                absoluteAuthTimeoutParam: '__absoluteExpire',
                returnUrlParam: '__returnUrl',
                identityCookieParam: '__identity',
                assignmentsParam: '__assignments',
                defaultAssignments: [],
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

    constructor (req, res, next, opts) {
        super({
            req, 
            res, 
            next, 
            opts, 
            session: req.session, 
            canCache: {}
        });
    }

    init () {
        super.init();                                                     
        if (!this.opts.Identity) {
            throw new Error(`${this.constructor.name}: Identity class is not set`);
        }
        if (this.opts.enableAutoLogin && !this.opts.identityCookieParam) {
            throw new Error(`${this.constructor.name}: identityCookieParam is not set`);
        }
    }

    getTitle (defaultValue) {
        return this.identity ? this.identity.getTitle() : defaultValue === undefined ? '' : defaultValue;
    }

    // LOGIN

    isGuest () {
        return this.identity === null;
    }

    getId () {
        return this.identity ? this.identity.getId() : null;
    }

    getIp () {
        return this.req.ip;
    }

    getReturnUrl (defaultUrl) {
        let url = this.session[this.opts.returnUrlParam] || defaultUrl;
        return url ? url : this.opts.returnUrl ? this.opts.returnUrl : this.res.locals.module.getHomeUrl();
    }

    setReturnUrl (url) {
        this.session[this.opts.returnUrlParam] = url;
    }

    login (identity, duration, cb) {
        duration = duration ? duration : 0;
        async.series([
            cb => this.beforeLogin(identity, false, duration, cb),
            cb => this.switchIdentity(identity, duration, cb),
            cb => this.afterLogin(identity, false, duration, cb)
        ], cb);
    }

    loginByCookie (cb) {
        let value = this.req.cookies[this.opts.identityCookieParam];
        if (value && typeof value === 'object' && typeof value.id === 'string'
            && typeof value.key === 'string' && typeof value.duration === 'number') {
            let duration = value.duration;
            async.waterfall([
                cb => this.opts.Identity.findIdentity(value.id).one(cb),
                (identity, cb)=> {
                    identity && identity.validateAuthKey(value.key) ? async.series([
                        cb => this.beforeLogin(identity, true, duration, cb),
                        cb => this.switchIdentity(identity, this.opts.autoRenewCookie ? duration : 0, cb),
                        cb => this.afterLogin(identity, true, duration, cb)
                    ], cb) : cb();
                }
            ], cb);
        } else {
            cb();
        }
    }

    logout (cb, destroySession = true) {
        let identity = this.identity;
        identity ? async.series([
            cb => this.beforeLogout(identity, cb),
            cb => this.switchIdentity(null, 0, cb),
            cb => this.afterLogout(identity, cb)
        ], cb) : cb();
    }

    loginRequired () {
        if (this.opts.enableSession) {
            this.setReturnUrl(this.req.originalUrl);
        }
        this.opts.loginUrl && !this.req.xhr   
            ? this.res.redirect(this.opts.loginUrl) 
            : this.next(new ForbiddenHttpException);
    }

    // EVENTS

    // if override this method call - super.beforeLogin
    beforeLogin (identity, cookieBased, duration, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGIN, cb, new ExtEvent({
            identity, cookieBased, duration
        }));
    }

    afterLogin (identity, cookieBased, duration, cb) {
        this.triggerCallback(this.EVENT_AFTER_LOGIN, cb, new ExtEvent({
            identity, cookieBased, duration
        }));
    }

    beforeLogout (identity, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGOUT, cb, new ExtEvent({identity}));
    }

    afterLogout (identity, cb) {
        this.triggerCallback(this.EVENT_AFTER_LOGOUT, cb, new ExtEvent({identity}));
    }

    // IDENTITY

    ensureIdentity (cb, autoRenew = true) {
        if (this.identity !== undefined) {
            return cb();
        }
        this.identity = null;
        this.opts.enableSession && autoRenew
            ? this.renewAuthStatus(()=> this.setAssignments(cb))
            : cb();
    }

    setIdentity (identity) {
        this.identity = identity;
    }

    switchIdentity (identity, duration, cb) {
        this.setIdentity(identity);
        if (!this.opts.enableSession) {
            return cb();
        }
        let returnUrl = this.getReturnUrl();
        // created new session instance
        this.session.regenerate(()=> {
            this.session = this.req.session;
            this.setReturnUrl(returnUrl);
            if (identity) {
                let now = Math.floor((new Date).getTime() / 1000);
                this.session[this.opts.idParam] = this.getId();
                if (this.opts.authTimeout !== null) {
                    this.session[this.opts.authTimeoutParam] = now + this.opts.authTimeout;
                }
                if (this.opts.absoluteAuthTimeout !== null) {
                    this.session[this.opts.absoluteAuthTimeoutParam] = now + this.opts.absoluteAuthTimeout;
                }
                if (this.assignments) {
                    this.session[this.opts.assignmentsParam] = this.assignments;
                }
                if (duration > 0 && this.opts.enableAutoLogin) {
                    this.sendIdentityCookie(identity, duration);
                }
            } else if (this.opts.enableAutoLogin) {
                this.res.clearCookie(this.opts.identityCookieParam, this.opts.identityCookie);
            }
            cb();
        });
    }

    sendIdentityCookie (identity, duration) {
        this.opts.identityCookie.maxAge = duration * 1000;
        this.res.cookie(this.opts.identityCookieParam, {
            id: identity.getId(),
            key: identity.getAuthKey(),
            duration
        }, this.opts.identityCookie);
    }

    // RENEW AUTH

    renewAuthStatus (cb) {
        let id = this.session[this.opts.idParam];
        id ? async.waterfall([
            cb => this.opts.Identity.findIdentity(id).one(cb),
            this.renewAuthExpire.bind(this)
        ], cb) : this.renewAuthExpire(null, cb);
    }

    renewAuthExpire (identity, cb) {
        this.setIdentity(identity);
        if (identity && (this.opts.authTimeout !== null || this.opts.absoluteAuthTimeout !== null)) {
            let now = Math.floor((new Date).getTime() / 1000);
            let expire = this.opts.authTimeout !== null
                ? this.session[this.opts.authTimeoutParam] : null;
            let expireAbsolute = this.opts.absoluteAuthTimeout !== null
                ? this.session[this.opts.absoluteAuthTimeoutParam] : null;
            if (expire !== null && expire < now || expireAbsolute !== null && expireAbsolute < now) {
                return this.logout(()=> this.renewAuthCookie(cb), false);
            }
            if (this.opts.authTimeout !== null) {
                this.session[this.opts.authTimeoutParam] = now + this.opts.authTimeout;
            }
        }
        this.renewAuthCookie(cb);
    }

    renewAuthCookie (cb) {
        if (this.opts.enableAutoLogin) {
            if (this.isGuest()) {
                return this.loginByCookie(cb);
            }
            if (this.opts.autoRenewCookie) {
                this.renewIdentityCookie();
            }
        }
        cb();
    }

    renewIdentityCookie () {
        let value = this.req.cookies[this.opts.identityCookieParam];
        if (value && typeof value === 'object' && typeof value.duration === 'number') {
            this.opts.identityCookie.maxAge = value.duration * 1000;
            this.res.cookie(this.opts.identityCookieParam, value, this.opts.identityCookie);
        }
    }

    // RBAC

    setAssignments (cb) {
        this.identity && this.res.locals.module.components.rbac ? async.waterfall([
            cb => this.identity.getAssignments(cb),
            (result, cb)=> {
                this.assignments = result || this.opts.defaultAssignments || [];
                cb();
            }
        ], cb) : cb();
    }

    can (name, cb, params) {
        Object.prototype.hasOwnProperty.call(this.canCache, name)
            ? cb(null, this.canCache[name]) : this.forceCan(name, cb, params);
    }

    forceCan (name, cb, params) {
        this.res.locals.module.components.rbac.can(this.identity, this.assignments, name, (err, access)=> {
            if (err) {
                return cb(err);
            }
            this.canCache[name] = access ? true : false;
            cb(null, access);
        }, params);
    }
};
module.exports.init();

const async = require('async');
const ExtEvent = require('../base/ExtEvent');
const ForbiddenHttpException = require('../errors/ForbiddenHttpException');
const ServerErrorHttpException = require('../errors/ServerErrorHttpException');