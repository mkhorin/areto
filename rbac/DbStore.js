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
        for (let elem of data.assignments) {
            let item = data.itemMap[elem.item];
            if (item) {
                if (!result.assignments[elem.user]) {
                    result.assignments[elem.user] = [];
                }
                result.assignments[elem.user].push(item.name);
            }
        }
        return result;
    }

    prepareRule (data) {
        let Class = data.ruleClass;
        try {
            Class = require(Class);
        } catch (err) {
            try {
                Class = this.rbac.module.app.require(Class);
            } catch (err) {
                this.log('error', `Not found rule class: ${data.ruleClass}`);
                Class = Rule;
            }
        }
        if (!(Class.prototype instanceof Rule) && Class !== Rule) {
            this.log('error', `Base class of ${data.ruleClass} must be Rule`);
            Class = Rule;
        }
        return Object.assign(data.params || {}, {
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

    findRuleByName (name) {
        return this.find(this.TABLE_RULE).where({name});
    }

    // CREATE

    createItems (items, cb) {
        AsyncHelper.series([
            cb => AsyncHelper.eachOfSeries(items, (data, name, cb)=> {
                this.createItem(name, data, cb);
            }, cb),
            cb => AsyncHelper.eachOfSeries(items, (data, name, cb)=> {
                data.children ? this.setItemChildren(name, data, cb) : cb();
            }, cb),
            cb => AsyncHelper.eachOfSeries(items, (data, name, cb)=> {
                data.parents ? this.setItemParents(name, data, cb) : cb();
            }, cb)
        ], cb);
    }

    createItem (name, data, callback) {
        if (!Item.isValidType(data.type)) {
            return callback(`RBAC: Invalid '${type}' type  for '${name}' item`);
        }
        AsyncHelper.waterfall([
            cb => this.findItem().where({name}).one(cb),
            (item, cb)=> {
                if (item) {
                    this.log('warn', `RBAC: Item already exists: ${name}`);
                    return callback();
                }
                data.rule ? this.findRuleByName(data.rule).one(cb) : cb(null, null);
            },
            (rule, cb)=> {
                if (!rule && data.rule) {
                    return cb(`RBAC: Not found '${data.rule}' rule for '${name}' item`);
                }
                let doc = Object.assign({name}, data);
                doc.rule = rule ? rule[this.key] : null;
                delete doc.chldren;
                this.findItem().insert(doc, cb);
            }
        ], callback);
    }

    setItemChildren (name, data, cb) {
        AsyncHelper.waterfall([
            cb => this.findItemRelatives(name, data, 'children', cb),
            (ids, cb)=> {
                data.children = ids;
                this.find(this.TABLE_ITEM_CHILD).where({
                    parent: data.itemId,
                    child: data.children
                }).remove(cb);
            },
            cb => this.find(this.TABLE_ITEM_CHILD).insert(data.children.map(id => ({
                parent: data.itemId,
                child: id
            })), cb)
        ], cb);
    }

    setItemParents (name, data, cb) {
        AsyncHelper.waterfall([
            cb => this.findItemRelatives(name, data, 'parents', cb),
            (ids, cb)=> {
                data.parents = ids;
                this.find(this.TABLE_ITEM_CHILD).where({
                    parent: data.parents,
                    child: data.itemId
                }).remove(cb);
            },
            cb => this.find(this.TABLE_ITEM_CHILD).insert(data.parents.map(id => ({
                parent: id,
                child: data.itemId
            })), cb)
        ], cb);
    }

    findItemRelatives (name, data, relName, cb) {
        AsyncHelper.waterfall([
            cb => this.findItem().where({name}).one(cb),
            (item, cb)=> {
                data.itemId = item[this.key];
                this.findItem().where({name: data[relName]}).all(cb);
            },
            (items, cb)=> {
                items.length !== data[relName].length
                    ? cb(`RBAC: Not found '${data[relName]}' ${relName} for '${name}' item`)
                    : cb(null, items.map(item => item[this.key]));
            }
        ], cb);
    }

    createRules (rules, cb) {
        AsyncHelper.eachOfSeries(rules, (data, name, cb)=> {
            this.createRule(name, data, cb);
        }, cb);
    }

    createRule (name, data, cb) {
        AsyncHelper.waterfall([
            cb => this.find(this.TABLE_RULE).where({name}).one(cb),
            (rule, cb)=> {
                if (rule) {
                    this.log('warn', `RBAC: Rule already exists: ${name}`);
                    return cb();
                }
                this.find(this.TABLE_RULE).insert(Object.assign({name}, data), cb);            }
        ], cb);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const CommonHelper = require('../helpers/CommonHelper');
const Query = require('../db/Query');
const Item = require('./Item');
const Rule = require('./Rule');