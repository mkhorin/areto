/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Component');

module.exports = class AccessRule extends Base {

    constructor (config) {
        super({
            allow: true, // allow or deny rule result
            // actions: ['update'],
            // controllers: ['article'],
            // permissions: ['?', '@', 'reader'],
            // methods: ['get', 'post'],
            // deny: fn(action, user)
            ...config
        });
    }

    async can (action) {
        if ((this.actions && !this.actions.includes(action.name))
            || (this.methods && !this.methods.includes(action.controller.req.method?.toLowerCase()))
            || (this.controllers && !this.controllers.includes(action.controller.getBaseName()))) {
            return; // skip rule
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
        const user = action.user;
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