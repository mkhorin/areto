/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Item extends Base {

    static getConstants () {
        return {
            TYPE_PERMISSION: 'permission',
            TYPE_ROLE: 'role',
            TYPE_ROUTE: 'route'
        };
    }

    static isType (type) {
        return type === this.TYPE_PERMISSION
            || type === this.TYPE_ROLE
            || type === this.TYPE_ROUTE;
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

    async create () {
        if (!this.constructor.isType(this.data.type)) {
            return this.log('error', `Invalid type: ${this.data.type}`);
        }
        const item = await this.store.findItemByName(this.name).one();
        if (item) {
            return this.log('warn', 'Already exists');
        }
        const data = {
            name: this.name,
            ...this.data,
            ...await this.resolveRelations()
        };
        ObjectHelper.deleteProperties(['children', 'parents'], data);
        await this.store.findItem().insert(data);
    }

    async resolveRelations () {
        const result = {};
        result.rules = await this.resolveRuleRelation();
        return result;
    }

    async resolveRuleRelation () {
        let data = this.data.rules;
        if (!data) {
            return null;
        }
        if (!Array.isArray(data)) {
            data = [data];
        }
        const rules = [];
        for (const name of data) {
            const rule = await this.getRuleByName(name);
            if (rule) {
                rules.push(rule);
            }
        }
        return rules;
    }

    async getRuleByName (name) {
        const rule = await this.store.findRuleByName(name).scalar(this.store.key);
        if (!rule) {
            this.log('error', `Rule not found: ${name}`);
            return null;
        }
        return rule;
    }

    async setChildren () {
        if (!this.data.children || !this.data.children.length) {
            return null;
        }
        const child = await this.resolveRelatives('children');
        const parent = this.data.itemId;
        await this.store.findItemChild().and({child, parent}).delete();
        const items = child.map(child => ({child, parent}));
        await this.store.findItemChild().insert(items);
        this.data.children = child;
    }

    async setParents () {
        if (!this.data.parents || !this.data.parents.length) {
            return null;
        }
        const parent = await this.resolveRelatives('parents');
        const child = this.data.itemId;
        await this.store.findItemChild().and({child, parent}).delete();
        const items = parent.map(parent => ({child, parent}));
        await this.store.findItemChild().insert(items);
        this.data.parents = parent;
    }

    async resolveRelatives (key) {
        const item = await this.store.findItemByName(this.name).one();
        this.data.itemId = item ? item[this.store.key] : null;
        const names = this.data[key];
        const items = await this.store.findItemByName(names).all();
        this.checkFoundRelatives(items, names);
        return items.map(item => item[this.store.key]);
    }

    checkFoundRelatives (items, targets) {
        if (items.length !== targets.length) {
            const names = items.map(item => item.name);
            const misses = targets.filter(target => !names.includes(target));
            this.log('error', `No relatives found: ${misses}`);
        }
    }

    log (type, message, data) {
        this.store.log(type, `${this.constructor.name}: ${this.name}: ${message}`, data);
    }
};
module.exports.init();

const ObjectHelper = require('../../helper/ObjectHelper');