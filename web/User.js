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
                authTimeout: null, // in seconds
                absoluteAuthTimeout: null // in seconds
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
            throw new Error('User: Identity class is not set');
        }
        if (this.opts.enableAutoLogin && !this.opts.identityCookieParam) {
            throw new Error('User: identityCookieParam is not set');
        }
    }

    getTitle (defaultValue) {
        return this.identity ? this.identity.getTitle() : defaultValue === undefined ? '' : defaultValue;
    }

    // EVENTS

    beforeLogin (identity, cookieBased, duration, cb) {
        // if override this method call - super.beforeLogin
        this.triggerCallback(this.EVENT_BEFORE_LOGIN, cb, new UserEvent({
            identity, cookieBased, duration
        }));
    }

    afterLogin (identity, cookieBased, duration, cb) {
        this.trigger(this.EVENT_AFTER_LOGIN, new UserEvent({identity, cookieBased, duration}));
        cb();
    }

    beforeLogout (identity, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGOUT, cb, new UserEvent({identity}));
    }

    afterLogout (cb) {
        this.trigger(this.EVENT_AFTER_LOGOUT, new UserEvent);
        cb();
    }

    // IDENTITY

    checkIdentity (cb, autoRenew = true) {
        if (this.identity === undefined) {
            this.identity = null;
            if (this.opts.enableSession && autoRenew) {
                this.renewAuthStatus(()=> this.setAssignments(cb));
            } else {
                cb(null);
            }
        } else cb(this.identity);
    }

    setIdentity (identity) {
        this.identity = identity;
    }

    switchIdentity (identity, duration, cb) {
        this.setIdentity(identity);
        if (this.opts.enableSession) {
            let returnUrl = this.getReturnUrl();
            // created new session instance
            this.session.regenerate(err =>{
                this.session = this.req.session;
                this.setReturnUrl(returnUrl);
                if (identity) {
                    let now = Math.floor((new Date).getTime() / 1000);
                    this.session[this.opts.idParam] = identity.getId();
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
        } else cb();
    }

    // LOGIN

    isGuest () {
        return this.identity === null;
    }

    getId () {
        return this.identity ? this.identity.getId() : null;
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
        this.beforeLogin(identity, false, duration, err => {
            err ? cb(err) : this.switchIdentity(identity, duration, ()=> { 
                this.afterLogin(identity, false, duration, cb); 
            });
        });
    }

    loginByCookie (cb) {
        let value = this.req.cookies[this.opts.identityCookieParam];
        if (value && typeof value === 'object' && typeof value.id === 'string' 
            && typeof value.key === 'string' && typeof value.duration === 'number') {
            let duration = value.duration;
            this.opts.Identity.findIdentity(value.id).one((err, identity)=> {
                if (identity && identity.validateAuthKey(value.key)) {
                    this.beforeLogin(identity, true, duration, err => {
                        err ? cb(err) : this.switchIdentity(identity, this.opts.autoRenewCookie ? duration : 0, ()=> {
                            this.afterLogin(identity, true, duration, cb);
                        });
                    });
                } else cb();
            });
        } else cb();
    }

    logout (cb, destroySession = true) {
        if (this.identity) {
            this.beforeLogout(this.identity, err =>{
                if (err) {
                    return cb(err);
                }
                this.switchIdentity(null, 0, ()=>{
                    if (destroySession && this.opts.enableSession) {
                        this.session.destroy(()=> this.afterLogout(cb));
                    } else {
                        this.afterLogout(cb);
                    }
                });
            });
        } else cb();
    }

    loginRequired () {
        if (this.opts.enableSession) {
            this.setReturnUrl(this.req.originalUrl);
        }
        this.opts.loginUrl && !this.req.xhr   
            ? this.res.redirect(this.opts.loginUrl) 
            : this.next(new ForbiddenHttpException);
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
        if (id) {
            this.opts.Identity.findIdentity(id).one((err, identity)=> {
                this.renewAuthExpire(identity, cb);
            });
        } else {
            this.renewAuthExpire(null, cb);
        }
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
                this.logout(()=> this.opts.renewAuthCookie(cb), false);
                return;
            } else if (this.opts.authTimeout !== null) {
                this.session[this.opts.authTimeoutParam] = now + this.opts.authTimeout;
            }
        }
        this.renewAuthCookie(cb);
    }

    renewAuthCookie (cb) {
        if (this.opts.enableAutoLogin) {
            if (this.isGuest()) {
                this.loginByCookie(cb);
                return;
            } else if (this.opts.autoRenewCookie) {
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
        if (this.identity && this.res.locals.module.components.rbac) {
            this.identity.getAssignments((err, result)=> {
                this.assignments = result || this.opts.defaultAssignments || [];
                cb(err);
            });
        } else cb();
    }

    can (name, cb, params) {
        name in this.canCache ? cb(null, this.canCache[name]) : this.forceCan(name, cb, params);
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

const Session = require('./Session');
const UserEvent = require('./UserEvent');
const ForbiddenHttpException = require('../errors/ForbiddenHttpException');
const ServerErrorHttpException = require('../errors/ServerErrorHttpException');