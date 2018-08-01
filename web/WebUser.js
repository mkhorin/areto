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

    isGuest () {
        return !this.model;
    }

    getTitle (defaultValue = '') {
        return this.model ? this.model.getTitle() : defaultValue;
    }

    getId () {
        return this.model ? this.model.getId() : null;
    }

    getIp () {
        return this.req.ip;
    }

    getLocalModule () {
        return this.res.locals.module;
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

    login (model, duration, cb) {
        duration = duration || 0;
        AsyncHelper.series([
            cb => this.beforeLogin(model, false, duration, cb),
            cb => this.switchIdentity(model, duration, cb),
            cb => this.afterLogin(model, false, duration, cb)
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
            cb => this.owner.findUserModel(value.id).one(cb),
            (model, cb)=> {
                if (!model || !model.validateAuthKey(value.key)) {
                    return cb();
                }
                AsyncHelper.series([
                    cb => this.beforeLogin(model, true, duration, cb),
                    cb => this.switchIdentity(model, this.owner.autoRenewCookie ? duration : 0, cb),
                    cb => this.afterLogin(model, true, duration, cb)
                ], cb);
            }
        ], cb);
    }

    logout (cb, destroySession = true) {
        let model = this.model;
        model ? AsyncHelper.series([
            cb => this.beforeLogout(model, cb),
            cb => this.switchIdentity(null, 0, cb),
            cb => this.afterLogout(model, cb)
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
    beforeLogin (model, cookieBased, duration, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGIN, cb, new Event({
            model, cookieBased, duration
        }));
    }

    afterLogin (model, cookieBased, duration, cb) {
        this.triggerCallback(this.EVENT_AFTER_LOGIN, cb, new Event({
            model, cookieBased, duration
        }));
    }

    beforeLogout (model, cb) {
        this.triggerCallback(this.EVENT_BEFORE_LOGOUT, cb, new Event({model}));
    }

    afterLogout (model, cb) {
        this.triggerCallback(this.EVENT_AFTER_LOGOUT, cb, new Event({model}));
    }

    // IDENTITY

    ensureIdentity (cb, autoRenew = true) {
        if (this.model !== undefined) {
            return cb();
        }
        this.model = null;
        this.owner.enableSession && autoRenew
            ? this.renewAuthStatus(()=> this.setAssignments(cb))
            : cb();
    }

    setIdentity (model) {
        this.model = model;
    }

    switchIdentity (model, duration, cb) {
        this.setIdentity(model);
        if (!this.owner.enableSession) {
            return cb();
        }
        let returnUrl = this.getReturnUrl();
        // created new session instance
        this.session.regenerate(()=> {
            this.session = this.req.session;
            this.setReturnUrl(returnUrl);
            if (model) {
                let now = Math.floor(Date.now() / 1000);
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
                    this.sendIdentityCookie(model, duration);
                }
            } else if (this.owner.enableAutoLogin) {
                this.res.clearCookie(this.owner.identityCookieParam, this.owner.identityCookie);
            }
            setImmediate(cb);
        });
    }

    sendIdentityCookie (model, duration) {
        this.owner.identityCookie.maxAge = duration * 1000;
        this.res.cookie(this.owner.identityCookieParam, {
            id: model.getId(),
            key: model.getAuthKey(),
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
            cb => this.owner.findUserModel(id).one(cb),
            this.renewAuthExpire.bind(this)
        ], cb);
    }

    renewAuthExpire (model, cb) {
        this.setIdentity(model);
        if (model && (this.owner.authTimeout !== null || this.owner.absoluteAuthTimeout !== null)) {
            let now = Math.floor(Date.now() / 1000);
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
            if (this.isGuest()) {
                return this.loginByCookie(cb);
            }
            if (this.owner.autoRenewCookie) {
                this.renewIdentityCookie();
            }
        }
        setImmediate(cb);
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
        if (!this.model) {
            this.assignments = this.owner.guestAssignments || [];
            return cb();
        }
        this.model.getAssignments((err, result)=> {
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

const AsyncHelper = require('../helper/AsyncHelper');
const Event = require('../base/Event');
const ForbiddenHttpException = require('../error/ForbiddenHttpException');
const Url = require('./Url');