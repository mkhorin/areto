'use strict';

const Base = require('../base/Component');

module.exports = class AccessRule extends Base {

    constructor (config) {
        super(Object.assign({
            allow: true, // allow or deny rule result
            // actions: ['update'],
            // controllers: ['article'],
            // roles: ['?', '@', 'reader'], // RBAC items
            // verbs: ['GET', 'POST'],
            // denyPromise: async (action, user)
        }, config));
    }

    async can (action, user) {
        if ((this.actions && !this.actions.includes(action.name))
            || (this.verbs && !this.verbs.includes(action.controller.req.method))
            || (this.controllers && !this.controllers.includes(action.controller.NAME))) {
            return; // skip rule
        }
        let access = await this.match(user);
        if (access === true) {
            return this.allow;
        }
        if (access === false) {
            return !this.allow;
        }
    }

    async match (user) {
        if (!(this.roles instanceof Array)) {
            return;
        }
        let roles = [];
        for (let item of this.roles) {
            if (item === '?') {
                return user.isGuest();
            }
            if (item === '@') {
                return !user.isGuest();
            }
            roles.push(item);
        }
        for (let item of roles) {
            if (await user.can(item)) {
                return true;
            }
        }
        return false;
    }
};