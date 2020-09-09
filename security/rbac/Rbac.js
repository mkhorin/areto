/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Component');

module.exports = class Rbac extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_LOAD: 'afterLoad'
        };
    }

    constructor (config) {
        super({
            Inspector: require('./Inspector'),
            Item: require('./Item'),
            Store: require('./FileRbacStore'),
            ...config
        });
        this.store = this.spawn(this.Store, {rbac: this});
    }

    async init () {
        await PromiseHelper.setImmediate();
        await this.load();
    }

    async load () {
        if (this._loading) {
            throw new Error('Loading in progress');
        }
        try {
            this._loading = true;
            const data = await this.store.load();
            this._loading = false;
            this.build(data);
            await this.afterLoad();
            await PromiseHelper.setImmediate();
        } catch (err) {
            this._loading = false;
            throw err;
        }
    }

    afterLoad () {
        return this.trigger(this.EVENT_AFTER_LOAD);
    }

    build (data) {
        this.ruleMap = {};
        for (const name of Object.keys(data.rules)) {
            this.ruleMap[name] = ClassHelper.normalizeSpawn(data.rules[name], {name});
        }
        this.resolveItemRules(data.items);
        this.itemMap = {};
        for (const name of Object.keys(data.items)) {
            this.itemMap[name] = this.spawn(this.Item, {...data.items[name], rbac: this});
        }
        for (const id of Object.keys(data.items)) {
            this.resolveItemLinks(this.itemMap[id]);
        }
        this.assignmentMap = data.assignments;
    }

    resolveItemRules (itemMap) {
        for (const item of Object.values(itemMap)) {
            const rule = item.rule;
            if (rule) {
                item.rule = Object.prototype.hasOwnProperty.call(this.ruleMap, rule)
                    ? this.ruleMap[rule]
                    : ClassHelper.normalizeSpawn(rule);
            }
        }
    }

    resolveItemLinks (item) {
        if (!Array.isArray(item.children)) {
            return;
        }
        const children = [];
        for (const id of item.children) {
            if (!(this.itemMap[id] instanceof this.Item)) {
                throw new Error(`Unknown child: ${id}`);
            }
            children.push(this.itemMap[id]);
            this.itemMap[id].addParent(item);
        }
        item.children = children;
    }

    getItem (id) {
        return Object.prototype.hasOwnProperty.call(this.itemMap, id) ? this.itemMap[id] : null;
    }

    findUser (name) {
        return this.spawn(this.module.get('auth').Identity).find({name});
    }

    getUserAssignments (userId) {
        return Object.prototype.hasOwnProperty.call(this.assignmentMap, userId)
            ? this.assignmentMap[userId]
            : null;
    }

    async can (assignments, id, params) {
        const item = this.getItem(id);
        if (this._loading || !item || !assignments || !assignments.length) {
            return false;
        }
        const inspector = this.spawn(this.Inspector, {rbac: this, params});
        for (const assignment of assignments) {
            if (Object.prototype.hasOwnProperty.call(this.itemMap, assignment)) {
                inspector.assignment = this.itemMap[assignment];
                if (await inspector.execute(item)) {
                    return true;
                }
            }
        }
    }

    // CREATE

    assignItem () {
        return this.store.createAssignment(...arguments);
    }

    async createByData (data) {
        if (data) {
            await this.store.createRules(data.rules);
            await this.store.createItems(data.items);
            await this.store.createPermissionItems(data.permissions);
            await this.store.createRoleItems(data.roles);
            await this.store.createRouteItems(data.routes);
            await this.store.createAssignments(data.assignments);
        }
    }
};
module.exports.init();

const ClassHelper = require('../../helper/ClassHelper');
const PromiseHelper = require('../../helper/PromiseHelper');