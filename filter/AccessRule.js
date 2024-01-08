/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class AccessRule extends Base {

    /**
     * @param {Object} config
     * @param {boolean} config.allow - Allow or deny rule result
     * @param {string[]} config.actions - Action names
     * @param {string[]} config.controllers - Controller names
     * @param {string[]} config.permissions - Permission names: ['?', '@', 'reader']
     * @param {string[]} config.methods - Method names: ['get', 'post']
     * @param {function} config.deny - (action) => ...
     */
    constructor (config) {
        super({
            allow: true,
            ...config
        });
    }

    async can (action) {
        if (this.actions) {
            if (!this.actions.includes(action.name)) {
                return; // skip rule
            }
        }
        if (this.methods) {
            const name = action.controller.req.method?.toLowerCase();
            if (!this.methods.includes(name)) {
                return;
            }
        }
        if (this.controllers) {
            const name = action.controller.getBaseName();
            if (!this.controllers.includes(name)) {
                return;
            }
        }
        const access = await this.match(action);
        if (access === true) {
            return this.allow;
        }
        if (access === false) {
            return !this.allow;
        }
    }

    async match (action) {
        if (!Array.isArray(this.permissions)) {
            return true;
        }
        const permissions = [];
        const {user} = action;
        for (const item of this.permissions) {
            if (item === '?') {
                return user.isGuest();
            }
            if (item === '@') {
                return !user.isGuest();
            }
            permissions.push(item);
        }
        const params = {
            controller: action.controller
        };
        for (const item of permissions) {
            if (await user.can(item, params)) {
                return true;
            }
        }
        return false;
    }
};