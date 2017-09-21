'use strict';

const Base = require('../base/Base');

module.exports = class Item extends Base {

    static getConstants () {
        return {
            TYPE_PERMISSION: 'permission',
            TYPE_ROLE: 'role',
            TYPE_ROUTE: 'route'
        };
    }

    isPermission () {
        return this.type === this.TYPE_PERMISSION;
    }

    isRole () {
        return this.type === this.TYPE_ROLE;
    }

    isRoute () {
        return this.type === this.TYPE_ROUTE;
    }

    addParent (item) {
        if (!this.parents) {
            this.parents = [];
        }
        this.parents.push(item);
    }
};
module.exports.init();