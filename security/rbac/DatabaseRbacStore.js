/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RbacStore');

module.exports = class DatabaseRbacStore extends Base {

    static getConstants () {
        return {
            TABLE_ITEM: 'item',
            TABLE_ITEM_CHILD: 'item_child',
            TABLE_ASSIGNMENT: 'assignment',
            TABLE_RULE: 'rule'
        };
    }

    constructor (config) {
        super({
            tablePrefix: 'rbac_',
            key: '_id',
            ...config
        });
    }

    getDb () {
        return this.rbac.module.getDb();
    }

    async clearAll () {
        const db = this.getDb();
        await db.truncate(this.getTableName(this.TABLE_ASSIGNMENT));
        await db.truncate(this.getTableName(this.TABLE_ITEM_CHILD));
        await db.truncate(this.getTableName(this.TABLE_ITEM));
        await db.truncate(this.getTableName(this.TABLE_RULE));
    }

    async load () {
        return this.prepare(await this.loadData());
    }

    async loadData () {
        return {
            itemMap: await this.find(this.TABLE_ITEM).index(this.key).all(),
            ruleMap: await this.find(this.TABLE_RULE).index(this.key).all(),
            links: await this.find(this.TABLE_ITEM_CHILD).all(),
            assignments: await this.find(this.TABLE_ASSIGNMENT).all()
        };
    }

    prepare (data) {
        const rules = this.prepareRules(data);
        const items = this.prepareItems(data);
        const assignments = this.prepareAssignments(data);
        return {rules, items, assignments};
    }

    prepareItems (data) {
        const result = {};
        for (const id of Object.keys(data.itemMap)) {
            const item = this.prepareItem(id, data);
            result[item.name] = item;
        }
        return result;
    }

    prepareItem (id, data) {
        const item = data.itemMap[id];
        item.children = this.getItemChildren(id, data);
        item.rules = this.getItemRules(item, data.ruleMap);
        return item;
    }

    prepareRules ({ruleMap}) {
        const result = {};
        for (const id of Object.keys(ruleMap)) {
            const rule = this.prepareRule(ruleMap[id]);
            if (rule) {
                ruleMap[id] = rule;
                result[rule.name] = rule;
            } else {
                delete ruleMap[id];
            }
        }
        return result;
    }

    prepareRule ({name, config}) {
        try {
            const data = CommonHelper.parseJson(config);
            if (!data) {
                return this.log('error', `Invalid rule: ${name}:`, config);
            }
            config = ClassHelper.resolveSpawn(Rule, this.rbac.module, data);
        } catch {
            return this.log('error', `Invalid rule: ${name}: ${JSON.stringify(config)}`);
        }
        if (!(config.Class.prototype instanceof Rule) && config.Class !== Rule) {
            return this.log('error', `Base class of ${config.Class.name} must be Rule`);
        }
        return {...config, name};
    }

    prepareAssignments ({assignments, itemMap}) {
        const result = {};
        for (const assignment of assignments) {
            const item = itemMap[assignment.item];
            if (item) {
                if (!result[assignment.user]) {
                    result[assignment.user] = [];
                }
                result[assignment.user].push(item.name);
            }
        }
        return result;
    }

    getItemRules (item, ruleMap) {
        if (!item.rules) {
            return null;
        }
        const names = [];
        for (const id of item.rules) {
            ruleMap.hasOwnProperty(id)
                ? names.push(ruleMap[id].name)
                : this.log('error', `Rule not found: ${id}`);
        }
        return names.length ? names : null;
    }

    getItemChildren (id, {links, itemMap}) {
        const result = [];
        for (const {child, parent} of links) {
            if (CommonHelper.isEqual(parent, id) && itemMap[child]) {
                result.push(itemMap[child].name);
            }
        }
        return result;
    }

    getTableName (name) {
        return this.tablePrefix + name;
    }

    find (table) {
        return (new Query).db(this.getDb()).from(this.getTableName(table));
    }

    findItem () {
        return this.find(this.TABLE_ITEM);
    }

    findItemByName (name) {
        return this.findItem().and({name});
    }

    findRoleItem () {
        return this.findItem().and({type: this.rbac.Item.TYPE_ROLE});
    }

    findPermissionItem () {
        return this.findItem().and({type: this.rbac.Item.TYPE_PERMISSION});
    }

    findRouteItem () {
        return this.findItem().and({type: this.rbac.Item.TYPE_ROUTE});
    }

    findItemChild () {
        return this.find(this.TABLE_ITEM_CHILD);
    }

    findRule () {
        return this.find(this.TABLE_RULE);
    }

    findRuleByName (name) {
        return this.findRule().and({name});
    }

    findAssignment () {
        return this.find(this.TABLE_ASSIGNMENT);
    }

    findAssignmentByUser (user) {
        return this.findAssignment().and({user});
    }

    // CREATE

    createPermissionItems (items) {
        return this.createTypeItems(this.rbac.Item.TYPE_PERMISSION, items);
    }

    createRoleItems (items) {
        return this.createTypeItems(this.rbac.Item.TYPE_ROLE, items);
    }

    createRouteItems (items) {
        return this.createTypeItems(this.rbac.Item.TYPE_ROUTE, items);
    }

    async createTypeItems (type, data) {
        if (data) {
            for (const name of Object.keys(data)) {
                data[name].type = type;
            }
            await this.createItems(data);
        }
    }

    async createItems (data) {
        if (!data) {
            return null;
        }
        const items = [];
        for (const name of Object.keys(data)) {
            items.push(this.createItem(name, data[name]));
        }
        for (const item of items) {
            await item.create();
        }
        for (const item of items) {
            await item.setChildren();
        }
        for (const item of items) {
            await item.setParents();
        }
    }

    createItem (name, data) {
        return new this.rbac.Item({store: this, name, data});
    }

    async createRules (data) {
        if (data) {
            for (const key of Object.keys(data)) {
                await this.createRule(data[key], key);
            }
        }
    }

    async createRule (data, name) {
        const rule = await this.findRuleByName(name).one();
        if (rule) {
            return this.log('warn', `Rule already exists: ${name}`);
        }
        await this.findRule().insert({name, ...data});
    }

    async createAssignments (data) {
        if (data) {
            for (const key of Object.keys(data)) {
                await this.createAssignmentsByNames(data[key], key);
            }
        }
    }

    async createAssignmentsByNames (names, user) {
        if (typeof names === 'string') {
            names = [names];
        }
        if (!Array.isArray(names)) {
            return false;
        }
        const model = await this.rbac.findUser(user).one();
        if (!model) {
            return this.log('error', `User not found: ${user}`);
        }
        for (const name of names) {
            await this.createAssignment(name , model.getId());
        }
    }

    async createAssignment (name, user) {
        const item = await this.findItemByName(name).scalar(this.key);
        if (!item) {
            return this.log('error', `Assignment item not found: ${name}`);
        }
        if (!await this.findAssignment().and({item, user}).one()) {
            return this.findAssignment().insert({item, user});
        }
    }
};
module.exports.init();

const ClassHelper = require('../../helper/ClassHelper');
const CommonHelper = require('../../helper/CommonHelper');
const Query = require('../../db/Query');
const Rule = require('./Rule');