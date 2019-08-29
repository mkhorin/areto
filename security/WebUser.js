/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class WebUser extends Base {

    _accessCache = {};

    isGuest () {
        return !this.identity;
    }

    isSession () {
        return this.auth.enableSession;
    }

    getTitle (defaults = '[anonymous]') {
        return this.identity ? this.identity.getTitle() : defaults;
    }

    getId () {
        return this.identity ? this.identity.getId() : null;
    }

    getIdentity () {
        return this.identity;
    }

    getAuthKey () {
        return this.identity ? this.identity.getAuthKey() : null;
    }

    getIp () {
        return this.req.ip;
    }

    getLoginUrl () {
        return this.auth.loginUrl;
    }

    getReturnUrl (url) {
        url = this.getSession(this.auth.returnUrlParam) || url || this.auth.returnUrl;
        return url || this.module.getHomeUrl();
    }

    setReturnUrl (url) {
        this.setSession(this.auth.returnUrlParam, url);
    }

    // LOGIN

    login () {
        return this.auth.login(this, ...arguments);
    }

    logout () {
        return this.isGuest() ? false : this.auth.logout(this);
    }

    // IDENTITY

    async ensureIdentity () {
        if (this.identity === undefined) {
            this.identity = null;
            if (this.isSession()) {
                await this.auth.renew(this);
                await this.setAssignments();
            }
        }
    }

    async switchIdentity (identity, duration) {
        this.identity = identity;
        if (this.isSession()) {
            const returnUrl = this.getReturnUrl();
            await this.createSession();
            this.setReturnUrl(returnUrl);
            this.auth.renewIdentity(this, duration);
        }
    }

    findIdentity (id) {
        return this.createIdentity().findIdentity(id);
    }

    createIdentity () {
        return this.module.spawn(this.auth.Identity);
    }

    // ACCESS CONTROL

    can (name) {
        return Object.prototype.hasOwnProperty.call(this._accessCache, name)
            ? this._accessCache[name]
            : this.resolveAccess(...arguments);
    }

    async resolveAccess (name, params) {
        params = {user: this, ...params};
        const access = await this.auth.rbac.can(this.assignments, name, params);
        return this._accessCache[name] = !!access;
    }

    async setAssignments () {
        if (this.auth.rbac) {
            this.assignments = this.identity
                ? await this.identity.getAssignments() || this.auth.defaultAssignments
                : this.auth.guestAssignments;
        }
    }

    // SESSION

    getSession (name) {
        return this.req.session[name];
    }

    setSession (name, value) {
        this.req.session[name] = value;
    }

    createSession () { // create new session instance
        return PromiseHelper.promise(this.req.session.regenerate, this.req.session);
    }

    // COOKIE

    getCookie (name) {
        return this.req.cookies[name];
    }

    setCookie () {
        this.res.cookie(...arguments);
    }

    clearCookie () {
        this.res.clearCookie(...arguments);
    }
};
module.exports.init();

const PromiseHelper = require('../helper/PromiseHelper');