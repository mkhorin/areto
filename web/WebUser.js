/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
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

    constructor (config) {
        super(config);
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

    async login (model, duration) {
        duration = duration || 0;
        await this.beforeLogin(model, false, duration);
        await this.switchIdentity(model, duration);
        await this.afterLogin(model, false, duration);
    }

    async loginByCookie () {
        let value = this.req.cookies[this.owner.identityCookieParam];
        if (!value || typeof value !== 'object'
            || typeof value.id !== 'string'
            || typeof value.key !== 'string'
            || typeof value.duration !== 'number') {
            return false;
        }
        let duration = value.duration;
        let model = await this.owner.findUserModel(value.id).one();
        if (model && model.validateAuthKey(value.key)) {
            await this.beforeLogin(model, true, duration);
            await this.switchIdentity(model, this.owner.autoRenewCookie ? duration : 0);
            await this.afterLogin(model, true, duration);
        }
    }

    async logout (destroySession = true) {
        if (this.model) {
            await this.beforeLogout(this.model);
            await this.switchIdentity(null, 0);
            await this.afterLogout(this.model);
        }
    }

    loginRequired (controller) {
        if (this.owner.enableSession) {
            this.setReturnUrl(this.req.originalUrl);
        }
        if (this.req.xhr || !this.getLoginUrl()) {
            return this.next(new ForbiddenHttpException);
        }
        (controller || this.res).redirect(Url.create(this.getLoginUrl(), this.getLocalModule()));
    }

    // EVENTS

    // if override this method await super.beforeLogin
    beforeLogin (model, cookieBased, duration) {
        return this.trigger(this.EVENT_BEFORE_LOGIN, new Event({model, cookieBased, duration}));
    }

    afterLogin (model, cookieBased, duration) {
        return this.trigger(this.EVENT_AFTER_LOGIN, new Event({model, cookieBased, duration}));
    }

    beforeLogout (model) {
        return this.trigger(this.EVENT_BEFORE_LOGOUT, new Event({model}));
    }

    afterLogout (model) {
        return this.trigger(this.EVENT_AFTER_LOGOUT, new Event({model}));
    }

    // IDENTITY

    async ensureIdentity (autoRenew = true) {
        if (this.model === undefined) {
            this.model = null;
            if (this.owner.enableSession && autoRenew) {
                await this.renewAuthStatus();
                await this.setAssignments();
            }
        }
    }

    setIdentity (model) {
        this.model = model;
    }

    async switchIdentity (model, duration) {
        this.setIdentity(model);
        if (!this.owner.enableSession) {
            return false;
        }
        let returnUrl = this.getReturnUrl();
        await PromiseHelper.promise(this.session.regenerate.bind(this.session)); // created new session instance
        this.session = this.req.session;
        this.setReturnUrl(returnUrl);
        if (model) {
            this.setIdentitySession(model, duration);
        } else if (this.owner.enableAutoLogin) {
            this.res.clearCookie(this.owner.identityCookieParam, this.owner.identityCookie);
        }
    }

    setIdentitySession (model, duration) {
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

    async renewAuthStatus () {
        let id = this.session[this.owner.idParam];
        let model = id ? await this.owner.findUserModel(id).one() : null;
        await this.renewAuthExpire(model);
    }

    async renewAuthExpire (model) {
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
                await this.logout(false);
            } else if (this.owner.authTimeout !== null) {
                this.session[this.owner.authTimeoutParam] = now + this.owner.authTimeout;
            }
        }
        await this.renewAuthCookie();
    }

    async renewAuthCookie () {
        if (this.owner.enableAutoLogin) {
            if (this.isGuest()) {
                await this.loginByCookie();
            }
            if (this.owner.autoRenewCookie) {
                await this.renewIdentityCookie();
            }
        }
    }

    renewIdentityCookie () {
        let value = this.req.cookies[this.owner.identityCookieParam];
        if (value && typeof value.duration === 'number') {
            this.owner.identityCookie.maxAge = value.duration * 1000;
            this.res.cookie(this.owner.identityCookieParam, value, this.owner.identityCookie);
        }
    }

    // RBAC

    async setAssignments () {
        if (!this.getLocalModule().components.rbac) {
            return;
        }
        if (!this.model) {
            return this.assignments = this.owner.guestAssignments || [];
        }
        let result = await this.model.getAssignments();
        this.assignments = result || this.owner.defaultAssignments || [];
    }

    can (name, params) {
        return Object.prototype.hasOwnProperty.call(this._accessCache, name)
            ? this._accessCache[name]
            : this.forceCan(name, params);
    }

    async forceCan (name, params) {
        params = {
            user: this,
            ...params
        };
        let access = await this.getLocalModule().components.rbac.can(this.assignments, name, params);
        return this._accessCache[name] = !!access;
    }
};
module.exports.init();

const PromiseHelper = require('../helper/PromiseHelper');
const Event = require('../base/Event');
const ForbiddenHttpException = require('../error/ForbiddenHttpException');
const Url = require('./Url');