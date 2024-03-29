/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class WebUser extends Base {

    _accessMap = {};

    isGuest () {
        return !this.identity;
    }

    isId (id) {
        return this.identity ? this.identity.isId(id) : false;
    }

    isSession () {
        return this.auth.enableSession;
    }

    getTitle (guest = '[guest]') {
        return this.identity ? this.identity.getTitle() : guest;
    }

    getId () {
        return this.identity?.getId();
    }

    getIdentity () {
        return this.identity;
    }

    getAuthKey () {
        return this.identity?.getAuthKey();
    }

    getIp () {
        return this.req.ip;
    }

    getLoginUrl () {
        return this.auth.loginUrl;
    }

    getReturnUrl (url) {
        return url
            || this.getSession(this.auth.returnUrlParam)
            || this.auth.returnUrl
            || this.module.getHomeUrl();
    }

    setReturnUrl (url) {
        this.setSession(this.auth.returnUrlParam, url);
    }

    getCsrfToken () {
        return this.auth.csrf
            ? this.getSession(this.auth.csrfParam)
            : '';
    }

    checkCsrfToken (token) {
        return this.auth.csrf
            ? this.getSession(this.auth.csrfParam) === token
            : true;
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

    can (permission) {
        return Object.hasOwn(this._accessMap, permission)
            ? this._accessMap[permission]
            : this.resolveAccess(...arguments);
    }

    async resolveAccess (permission, params) {
        const access = await this.auth.rbac.can(this.assignments, permission, params);
        return this._accessMap[permission] = !!access;
    }

    hasAssignment (name) {
        return Array.isArray(this.assignments)
            ? this.assignments.includes(name)
            : false;
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

    /**
     * Create new session instance
     */
    createSession () {
        return PromiseHelper.promise(this.req.session.regenerate, this.req.session);
    }

    // COOKIE

    getCookie (name) {
        return this.req.cookies[name];
    }

    setCookie (name, value, options) {
        options = Object.assign(this.getDefaultCookieOptions(), options);
        this.res.cookie(name, value, options);
    }

    getDefaultCookieOptions () {
        return {
            sameSite: 'strict'
        };
    }

    clearCookie () {
        this.res.clearCookie(...arguments);
    }
};
module.exports.init();

const PromiseHelper = require('../helper/PromiseHelper');