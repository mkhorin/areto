/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Store');

module.exports = class DbStore extends Base {

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
        const {ruleMap, itemMap} = data;
        const rules = {};
        for (let id of Object.keys(ruleMap)) {
            let rule = this.prepareRule(ruleMap[id]);
            ruleMap[id] = rule;
            rules[rule.name] = rule;
        }
        const items = {};
        for (let id of Object.keys(itemMap)) {
            let item = itemMap[id];
            item.children = this.getItemChildren(id, data);
            item.rule = ruleMap.hasOwnProperty(item.rule) ? ruleMap[item.rule].name : null;
            items[item.name] = item;
        }
        const assignments = {};
        for (let assignment of data.assignments) {
            let item = itemMap[assignment.item];
            if (item) {
                if (!assignments[assignment.user]) {
                    assignments[assignment.user] = [];
                }
                assignments[assignment.user].push(item.name);
            }
        }
        return {rules, items, assignments};
    }

    prepareRule ({name, spawnConfig}) {
        const config = spawnConfig || {};
        config.Class = config.Class || Rule;
        try {
            ClassHelper.resolveSpawn(config, this.rbac.module);
        } catch (err) {
            this.log('error', `Invalid rule file: ${config.Class}`);
            config.Class = Rule;
        }
        if (!(config.Class.prototype instanceof Rule) && config.Class !== Rule) {
            this.log('error', `Base class of ${config.Class.name} must be Rule`);
            config.Class = Rule;
        }
        return {...config, name};
    }

    getItemChildren (id, {links, itemMap}) {
        const children = [];
        for (let link of links) {
            if (MongoHelper.isEqual(link.parent, id) && itemMap[link.child]) {
                children.push(itemMap[link.child].name);
            }
        }
        return children;
    }

    find (table) {
        return (new Query).db(this.getDb()).from(`${this.tablePrefix}${table}`);
    }

    findItem () {
        return this.find(this.TABLE_ITEM);
    }

    findItemByName (name) {
        return this.find(this.TABLE_ITEM).and({name});
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

    findRule (name) {
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

    async createTypeItems (type, items) {
        if (items) {
            for (let name of Object.keys(items)) {
                items[name].type = type;
            }
            await this.createItems(items);
        }
    }

    async createItems (data) {
        let items = this.prepareItems(data);
        for (let item of items) {
            await item.create();
        }
        for (let item of items) {
            await item.setChildren();
        }
        for (let item of items) {
            await item.setParents();
        }
    }

    prepareItems (data) {
        if (!data) {
            return [];
        }
        return Object.keys(data).map(name => new this.rbac.Item({            
            store: this,
            data: data[name],
            name
        }));
    }

    async createRules (data) {
        if (data) {
            for (let key of Object.keys(data)) {
                await this.createRule(data[key], key);
            }
        }
    }

    async createRule (data, name) {
        let rule = await this.findRuleByName(name).one();
        if (rule) {
            return this.log('warn', `Rule already exists: ${name}`);
        }
        await this.findRule().insert({name, ...data});
    }

    async createAssignments (data) {
        if (data) {
            for (let key of Object.keys(data)) {
                await this.createAssignment(data[key], key);
            }
        }
    }

    async createAssignment (names, user) {
        if (!Array.isArray(names)) {
            return false;
        }
        let items = await this.findItemByName(names).column(this.key);
        if (items.length !== names.length) {
            throw new Error(`RBAC: Not found assignment item: ${names}`);
        }
        let model = await this.rbac.findUserModel(user).one();
        if (!model) {
            throw new Error(`RBAC: Not found user: ${user}`);
        }
        user = model.getId();
        for (let item of items) {
            if (!await this.findAssignment().and({user, item}).one()) {
                await this.findAssignment().insert({user, item});
            }
        }
    }
};
module.exports.init();

const ClassHelper = require('../helper/ClassHelper');
const MongoHelper = require('../helper/MongoHelper');
const Query = require('../db/Query');
const Rule = require('./Rule');