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
            pk: '_id'
        }, config));
    }
    
    load (cb) {
        async.waterfall([
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
        async.series({
            itemIndex: cb => this.find(this.TABLE_ITEM).index(this.pk).all(cb),
            ruleIndex: cb => this.find(this.TABLE_RULE).index(this.pk).all(cb),
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
        for (let id of Object.keys(data.itemIndex)) {
            let item = data.itemIndex[id];
            item.children = this.getItemChildren(id, data);
            item.rule = data.ruleIndex[item.ruleId] ? data.ruleIndex[item.ruleId].name : null;
            result.items[item.name] = item;
        }
        for (let id of Object.keys(data.ruleIndex)) {
            let rule = data.ruleIndex[id];
            result.rules[rule.name] = rule;
        }
        for (let elem of data.assignments) {
            let item = data.itemIndex[elem.itemId];
            if (item) {
                if (!result.assignments[elem.userId]) {
                    result.assignments[elem.userId] = [];
                }
                result.assignments[elem.userId].push(item.name);
            }
        }
        return result;
    }

    getItemChildren (id, data) {
        let children = [];
        for (let link of data.links) {
            if (MiscHelper.isEqual(link.parentId, id) && data.itemIndex[link.childId]) {
                children.push(data.itemIndex[link.childId].name);
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
        async.series([
            cb => async.eachOfSeries(items, (data, name, cb)=> {
                this.createItem(name, data, cb);
            }, cb),
            cb => async.eachOfSeries(items, (data, name, cb)=> {
                data.children ? this.setItemChildren(name, data, cb) : cb();
            }, cb),
            cb => async.eachOfSeries(items, (data, name, cb)=> {
                data.parents ? this.setItemParents(name, data, cb) : cb();
            }, cb)
        ], cb);
    }

    createItem (name, data, callback) {
        if (!Item.isValidType(data.type)) {
            return callback(`RBAC: Invalid '${type}' type  for '${name}' item`);
        }
        async.waterfall([
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
                let doc = Object.assign({
                    name,
                    ruleId: rule ? rule[this.pk] : null
                }, data);
                delete doc.rule;
                delete doc.chldren;
                this.findItem().insert(doc, cb);
            }
        ], callback);
    }

    setItemChildren (name, data, cb) {
        async.waterfall([
            cb => this.findItemRelatives(name, data, 'children', cb),
            (ids, cb)=> {
                data.children = ids;
                this.find(this.TABLE_ITEM_CHILD).where({
                    parentId: data.itemId,
                    childId: data.children
                }).remove(cb);
            },
            cb => this.find(this.TABLE_ITEM_CHILD).insert(data.children.map(child => ({
                parentId: data.itemId,
                childId: child
            })), cb)
        ], cb);
    }

    setItemParents (name, data, cb) {
        async.waterfall([
            cb => this.findItemRelatives(name, data, 'parents', cb),
            (ids, cb)=> {
                data.parents = ids;
                this.find(this.TABLE_ITEM_CHILD).where({
                    parentId: data.parents,
                    childId: data.itemId
                }).remove(cb);
            },
            cb => this.find(this.TABLE_ITEM_CHILD).insert(data.parents.map(parent => ({
                parentId: parent,
                childId: data.itemId
            })), cb)
        ], cb);
    }

    findItemRelatives (name, data, relName, cb) {
        async.waterfall([
            cb => this.findItem().where({name}).one(cb),
            (item, cb)=> {
                data.itemId = item[this.pk];
                this.findItem().where({name: data[relName]}).all(cb);
            },
            (items, cb)=> {
                items.length !== data[relName].length
                    ? cb(`RBAC: Not found '${data[relName]}' ${relName} for '${name}' item`)
                    : cb(null, items.map(item => item[this.pk]));
            }
        ], cb);
    }

    createRules (rules, cb) {
        async.eachOfSeries(rules, (data, name, cb)=> {
            this.createRule(name, data, cb);
        }, cb);
    }

    createRule (name, data, cb) {
        async.waterfall([
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

const async = require('async');
const MiscHelper = require('../helpers/MiscHelper');
const Query = require('../db/Query');
const Item = require('./Item');