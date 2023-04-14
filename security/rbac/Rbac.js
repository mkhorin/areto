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
        this.ruleMap = this.createRuleMap(data.rules);
        this.itemMap = this.createItemMap(data.items);
        for (const item of Object.values(this.itemMap)) {
            item.rules = this.resolveItemRules(item);
            item.children = this.resolveItemLinks(item);
        }
        this.assignmentMap = this.createAssignmentMap(data.assignments);
    }

    createRuleMap (data) {
        const result = {};
        for (const name of Object.keys(data)) {
            result[name] = ClassHelper.normalizeSpawn(data[name], {name});
        }
        return result;
    }

    createItemMap (data) {
        const result = {};
        for (const name of Object.keys(data)) {
            result[name] = this.spawn(this.Item, {...data[name], rbac: this});
        }
        return result;
    }

    createAssignmentMap (data) {
        return data;
    }

    resolveItemRules ({rules}) {
        if (!rules) {
            return null;
        }
        const result = [];
        for (const data of rules) {
            const rule = this.resolveRuleByData(data);
            rule ? result.push(rule)
                 : this.log('error', 'Invalid rule:', data);
        }
        return result.length ? result : null;
    }

    resolveRuleByData (data) {
        const rule = Object.hasOwn(this.ruleMap, data)
            ? this.ruleMap[data]
            : ClassHelper.normalizeSpawn(data);
        return typeof rule.Class === 'function' ? rule : null;
    }

    resolveItemLinks (item) {
        if (!Array.isArray(item.children)) {
            return null;
        }
        const result = [];
        for (const name of item.children) {
            const child = this.itemMap[name];
            if (child instanceof this.Item) {
                result.push(child);
                child.addParent(item);
            } else {
                this.log('error', `Unknown child: ${name}`);
            }
        }
        return result.length ? result : null;
    }

    getItem (id) {
        return Object.hasOwn(this.itemMap, id)
            ? this.itemMap[id]
            : null;
    }

    findUser (name) {
        return this
            .spawn(this.module.get('auth').Identity)
            .find({name});
    }

    getUserAssignments (userId) {
        return Object.hasOwn(this.assignmentMap, userId)
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
            if (Object.hasOwn(this.itemMap, assignment)) {
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