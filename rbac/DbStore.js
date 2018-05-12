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
    
    load (cb) {
        AsyncHelper.waterfall([
            cb => this.loadData(cb),
            (data, cb)=> {
                try {
                    data = this.prepare(data);
                } catch (err) {
                    return cb(err);
                }
                cb(null, data);
            }
        ], cb);
    }

    loadData (cb) {
        AsyncHelper.series({
            itemMap: cb => this.find(this.TABLE_ITEM).index(this.key).all(cb),
            ruleMap: cb => this.find(this.TABLE_RULE).index(this.key).all(cb),
            links: cb => this.find(this.TABLE_ITEM_CHILD).all(cb),
            assignments: cb => this.find(this.TABLE_ASSIGNMENT).all(cb)
        }, cb);
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
            item.rule = data.ruleMap.hasOwnProperty(item.rule) ? data.ruleMap[item.rule].name : null;
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
                this.log('error', this.wrapClassMessage(`Not found rule class: ${Class}`));
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
            if (CommonHelper.isEqual(link.parent, id) && data.itemMap[link.child]) {
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

    createPermissionItems (items, cb) {
        this.createTypeItems(this.rbac.Item.TYPE_PERMISSION, items, cb);
    }

    createRoleItems (items, cb) {
        this.createTypeItems(this.rbac.Item.TYPE_ROLE, items, cb);
    }

    createRouteItems (items, cb) {
        this.createTypeItems(this.rbac.Item.TYPE_ROUTE, items, cb);
    }

    createTypeItems (type, items, cb) {
        if (!items) {
            return cb();
        }
        for (let name of Object.keys(items)) {
            items[name].type = type;
        }
        this.createItems(items, cb);
    }

    createItems (data, cb) {
        let items = [];
        if (data) {
            for (let name of Object.keys(data)) {
                items.push(new this.rbac.Item({
                    name,
                    store: this,
                    data: data[name]
                }));
            }
        }
        AsyncHelper.series([
            cb => AsyncHelper.eachSeries(items, (item, cb)=> item.create(cb), cb),
            cb => AsyncHelper.eachSeries(items, (item, cb)=> item.setChildren(cb), cb),
            cb => AsyncHelper.eachSeries(items, (item, cb)=> item.setParents(cb), cb)
        ], cb);
    }

    createRules (data, cb) {
        AsyncHelper.eachOfSeries(data, this.createRule.bind(this), cb);
    }

    createRule (data, name, cb) {
        AsyncHelper.waterfall([
            cb => this.findRuleByName(name).one(cb),
            (rule, cb)=> {
                if (rule) {
                    this.log('warn', `RBAC: Rule already exists: ${name}`);
                    return cb();
                }
                this.findRule().insert(Object.assign({name}, data), cb);
            }
        ], cb);
    }

    createAssignments (data, cb) {
        AsyncHelper.eachOfSeries(data, this.createAssignment.bind(this), cb);
    }

    createAssignment (items, user, cb) {
        AsyncHelper.waterfall([
            cb => this.findItemByName(items).column(this.key, cb),
            (result, cb)=> {
                if (result.length !== items.length) {
                    return cb(`RBAC: Not found assignment item: ${items}`);
                }
                items = result;
                this.rbac.findUserModel(user).one(cb);
            },
            (model, cb)=> {
                if (!model) {
                    return cb(`RBAC: Not found user: ${user}`);
                }
                user = model.getId();
                AsyncHelper.eachSeries(items, (item, cb)=> {
                    AsyncHelper.waterfall([
                        cb => this.findAssignment().and({user, item}).one(cb),
                        (found, cb)=> {
                            found ? cb() : this.findAssignment().insert({user, item}, cb);
                        }
                    ], cb);
                }, cb);
            }
        ], cb);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const CommonHelper = require('../helpers/CommonHelper');
const Query = require('../db/Query');
const Rule = require('./Rule');