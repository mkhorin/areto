'use strict';

const Base = require('./Store');

module.exports = class DbStore extends Base {

    constructor (config) {
        super(Object.assign({
            db: config.manager.module.getDb(),
            tablePrefix: 'rbac_',
            pk: '_id'
        }, config));
    }
    
    load (cb) {
        async.waterfall([
            cb => async.series({
                itemIndex: cb => this.find('item').index(this.pk).all(cb),
                ruleIndex: cb => this.find('rule').index(this.pk).all(cb),
                links: cb => this.find('item_child').all(cb),
                assignments: cb => this.find('assignment').all(cb)
            }, cb),
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
            if (link.parentId == id && data.itemIndex[link.childId]) {
                children.push(data.itemIndex[link.childId].name);
            }
        }
        return children;
    }

    find (table) {
        return (new Query).db(this.db).from(`${this.tablePrefix}${table}`);
    }
};

const async = require('async');
const MainHelper = require('../helpers/MainHelper');
const Query = require('../db/Query');