/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
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
        super(Object.assign({
            db: config.rbac.module.getDb(),
            tablePrefix: 'rbac_',
            key: '_id'
        }, config));
    }
    
    async load () {
        return this.prepare(await this.loadData());
    }

    async loadData () {
        return {
            'itemMap': await this.find(this.TABLE_ITEM).index(this.key).all(),
            'ruleMap': await this.find(this.TABLE_RULE).index(this.key).all(),
            'links': await this.find(this.TABLE_ITEM_CHILD).all(),
            'assignments': await this.find(this.TABLE_ASSIGNMENT).all()
        };
    }

    prepare (data) {
        let result = {
            items: {},
            rules: {},
            assignments: {}
        };
        for (let id of Object.keys(data.ruleMap)) {
            let rule = this.prepareRule(data.ruleMap[id]);
            data.ruleMap[id] = rule;
            result.rules[rule.name] = rule;
        }
        for (let id of Object.keys(data.itemMap)) {
            let item = data.itemMap[id];
            item.children = this.getItemChildren(id, data);
            item.rule = data.ruleMap.hasOwnProperty(item.rule)
                ? data.ruleMap[item.rule].name
                : null;
            result.items[item.name] = item;
        }
        for (let doc of data.assignments) {
            let item = data.itemMap[doc.item];
            if (item) {
                if (!result.assignments[doc.user]) {
                    result.assignments[doc.user] = [];
                }
                result.assignments[doc.user].push(item.name);
            }
        }
        return result;
    }

    prepareRule (data) {
        let Class = data.classConfig && data.classConfig.Class;
        try {
            Class = require(Class);
        } catch (err) {
            try {
                Class = this.rbac.module.app.require(Class);
            } catch (err) {
                this.log('error', `Not found rule class: ${Class}`);
                Class = Rule;
            }
        }
        if (!(Class.prototype instanceof Rule) && Class !== Rule) {
            this.log('error', `Base class of ${data.classConfig.Class} must be Rule`);
            Class = Rule;
        }
        return Object.assign({}, data.classConfig, {
            Class,
            name: data.name
        });
    }

    getItemChildren (id, data) {
        let children = [];
        for (let link of data.links) {
            if (MongoHelper.isEqual(link.parent, id) && data.itemMap[link.child]) {
                children.push(data.itemMap[link.child].name);
            }
        }
        return children;
    }

    find (table) {
        return (new Query).db(this.db).from(`${this.tablePrefix}${table}`);
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
        let items = [];
        for (let name of Object.keys(data)) {
            items.push(new this.rbac.Item({
                name,
                store: this,
                data: data[name]
            }));
        }
        return items;
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
        await this.findRule().insert(Object.assign({name}, data));
    }

    async createAssignments (data) {
        if (data) {
            for (let key of Object.keys(data)) {
                await this.createAssignment(data[key], key);
            }
        }
    }

    async createAssignment (names, user) {
        let items = await this.findItemByName(items).column(this.key);
        if (items.length !== names.length) {
            throw new Error(`RBAC: Not found assignment item: ${names}`);
        }
        let model = this.rbac.findUserModel(user).one();
        if (!model) {
            throw new Error(`RBAC: Not found user: ${user}`);
        }
        user = model.getId();
        for (let item of item) {
            if (!await this.findAssignment().and({user, item}).one()) {
                await this.findAssignment().insert({user, item});
            }
        }
    }
};
module.exports.init();

const MongoHelper = require('../helper/MongoHelper');
const Query = require('../db/Query');
const Rule = require('./Rule');