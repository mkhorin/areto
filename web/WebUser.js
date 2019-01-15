/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
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
    
    getReturnUrl (url) {
        url = this.session[this.config.returnUrlParam] || url || this.config.returnUrl;
        return url || this.module.getHomeUrl();
    }

    setReturnUrl (url) {
        this.session[this.config.returnUrlParam] = url;
    }

    getLoginUrl () {
        return this.config.loginUrl;
    }

    getRbac (id = 'rbac') {
        return this.module.components.get(id);
    }

    async login (model, duration) {
        duration = duration || 0;
        await this.beforeLogin(model, false, duration);
        await this.switchIdentity(model, duration);
        await this.afterLogin(model, false, duration);
    }

    async loginByCookie () {
        let value = this.req.cookies[this.config.identityCookieParam];
        if (!value || typeof value !== 'object'
            || typeof value.id !== 'string'
            || typeof value.key !== 'string'
            || typeof value.duration !== 'number') {
            return false;
        }
        let duration = value.duration;
        let model = await this.config.findUserModel(value.id).one();
        if (model && model.validateAuthKey(value.key)) {
            await this.beforeLogin(model, true, duration);
            await this.switchIdentity(model, this.config.autoRenewCookie ? duration : 0);
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
        if (this.config.enableSession) {
            this.setReturnUrl(this.req.originalUrl);
        }
        if (this.req.xhr || !this.getLoginUrl()) {
            return this.next(new Forbidden);
        }
        (controller || this.res).redirect(Url.create(this.getLoginUrl(), this.module));
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
            if (this.config.enableSession && autoRenew) {
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
        if (!this.config.enableSession) {
            return false;
        }
        let returnUrl = this.getReturnUrl();
        await PromiseHelper.promise(this.session.regenerate.bind(this.session)); // created new session instance
        this.session = this.req.session;
        this.setReturnUrl(returnUrl);
        if (model) {
            this.setIdentitySession(model, duration);
        } else if (this.config.enableAutoLogin) {
            this.res.clearCookie(this.config.identityCookieParam, this.config.identityCookie);
        }
    }

    setIdentitySession (model, duration) {
        let now = Math.floor(Date.now() / 1000);
        this.session[this.config.idParam] = this.getId();
        if (this.config.authTimeout !== null) {
            this.session[this.config.authTimeoutParam] = now + this.config.authTimeout;
        }
        if (this.config.absoluteAuthTimeout !== null) {
            this.session[this.config.absoluteAuthTimeoutParam] = now + this.config.absoluteAuthTimeout;
        }
        if (this.assignments) {
            this.session[this.config.assignmentsParam] = this.assignments;
        }
        if (duration > 0 && this.config.enableAutoLogin) {
            this.sendIdentityCookie(model, duration);
        }
    }

    sendIdentityCookie (model, duration) {
        this.config.identityCookie.maxAge = duration * 1000;
        this.res.cookie(this.config.identityCookieParam, {
            'id': model.getId(),
            'key': model.getAuthKey(),
            'duration': duration
        }, this.config.identityCookie);
    }

    // RENEW AUTH

    async renewAuthStatus () {
        let id = this.session[this.config.idParam];
        let model = id ? await this.config.findUserModel(id).one() : null;
        await this.renewAuthExpire(model);
    }

    async renewAuthExpire (model) {
        this.setIdentity(model);
        if (model && (this.config.authTimeout !== null || this.config.absoluteAuthTimeout !== null)) {
            let now = Math.floor(Date.now() / 1000);
            let expire = this.config.authTimeout !== null
                ? this.session[this.config.authTimeoutParam]
                : null;
            let expireAbsolute = this.config.absoluteAuthTimeout !== null
                ? this.session[this.config.absoluteAuthTimeoutParam]
                : null;
            if (expire !== null && expire < now || expireAbsolute !== null && expireAbsolute < now) {
                await this.logout(false);
            } else if (this.config.authTimeout !== null) {
                this.session[this.config.authTimeoutParam] = now + this.config.authTimeout;
            }
        }
        await this.renewAuthCookie();
    }

    async renewAuthCookie () {
        if (this.config.enableAutoLogin) {
            if (this.isGuest()) {
                await this.loginByCookie();
            }
            if (this.config.autoRenewCookie) {
                await this.renewIdentityCookie();
            }
        }
    }

    renewIdentityCookie () {
        let value = this.req.cookies[this.config.identityCookieParam];
        if (value && typeof value.duration === 'number') {
            this.config.identityCookie.maxAge = value.duration * 1000;
            this.res.cookie(this.config.identityCookieParam, value, this.config.identityCookie);
        }
    }

    // RBAC

    async setAssignments () {
        if (!this.getRbac()) {
            return;
        }
        if (!this.model) {
            return this.assignments = this.config.guestAssignments || [];
        }
        let result = await this.model.getAssignments();
        this.assignments = result || this.config.defaultAssignments || [];
    }

    can (name, params) {
        return Object.prototype.hasOwnProperty.call(this._accessCache, name)
            ? this._accessCache[name]
            : this.forceCan(name, params);
    }

    async forceCan (name, params) {
        params = {
            'user': this,
            ...params
        };
        let access = await this.getRbac().can(this.assignments, name, params);
        return this._accessCache[name] = !!access;
    }
};
module.exports.init();

const PromiseHelper = require('../helper/PromiseHelper');
const Event = require('../base/Event');
const Forbidden = require('../error/ForbiddenHttpException');
const Url = require('./Url');