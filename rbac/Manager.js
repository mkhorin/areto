'use strict';

let Base = require('../base/Component');
let helper = require('../helpers/main');
let async = require('async');

module.exports = class Manager extends Base {

    static getConstants () {
        return {
            EVENT_AFTER_LOAD: 'afterLoad'
        };
    }
    
    constructor (config) {
        super(Object.assign({
            store: require('./FileStore')
        }, config));        
    }
    
    init () {
        super.init();
        this.store = helper.createInstance(this.store, {
            manager: this
        });
    }

    configure (cb) {
        setImmediate(()=>{
            this.load(cb);
        });
    }
   
    afterLoad () {
        this.trigger(this.EVENT_AFTER_LOAD);
    }

    load (cb) {
        if (this.loading) {
            cb(null, 'RBAC: Loading in progress...');
        } else {
            this.loading = true;
            this.store.load((err, data)=> {
                this.loading = false;
                if (err) {
                    this.module.log('error', 'RBAC: load', err);
                } else {
                    this.build(data);                    
                    this.afterLoad();                    
                }
                cb(err);
            });
        }
    }

    build (data) {
        this.ruleIndex = {};
        for (let id of Object.keys(data.rules)) {
            this.ruleIndex[id] = helper.createInstance(data.rules[id], {id});
        }
        this.itemIndex = {};
        for (let id of Object.keys(data.items)) {
            let rule = data.items[id].rule;
            if (rule) {
                data.items[id].rule = rule in this.ruleIndex
                    ? this.ruleIndex[rule] : helper.createInstance(rule, {id});
            }
            this.itemIndex[id] = new Item(data.items[id]);
        }
        for (let id of Object.keys(data.items)) {
            this.resolveItemLinks(this.itemIndex[id]);
        }
        this.assignmentIndex = data.assignments;
    }

    resolveItemLinks (item) {
        if (item.children) {
            let children = [];
            for (let id of item.children) {
                if (this.itemIndex[id] instanceof Item) {
                    children.push(this.itemIndex[id]);
                    this.itemIndex[id].addParent(item);
                } else {
                    throw new Error(`RBAC: Unknown child "${id}"`);
                }
            }
            item.children = children;
        }
    }

    getUserAssignments (userId) {
        return this.assignmentIndex[userId];
    }

    can (user, assignments, id, cb, params) {
        let item = this.itemIndex[id];
        if (!this.loading && item && assignments && assignments.length) {
            let result, data = {
                assignment: null,
                ruleCache: {},
                user,
                params
            };
            async.eachSeries(assignments, (assignment, cb2)=> {
                if (assignment in this.itemIndex) {
                    data.assignment = this.itemIndex[assignment];
                    this.canItem(item, data, (err, access)=> {
                        err ? cb(err) : access ? cb(null, true) : cb2();
                    });
                } else cb2();
            }, cb);
        } else {
            cb();
        }
    }
    
    canItem (item, data, cb) {
        this.canRule(item, data, (err, access)=> {
            if (err) {
                cb(err);
            } else if (!access) {
                cb();
            } else if (item !== data.assignment) {
                if (!item.parents || item.parents.length == 0) {
                    return cb();
                }
                async.eachSeries(item.parents, (parent, cb2)=> {
                    this.canItem(parent, data, (err, access)=> {
                        err ? cb(err) : access ? cb(null, true) : cb2();
                    });
                }, cb);
            } else {
                cb(null, true);
            }
        });
    }

    canRule (item, data, cb) {
        if (item.rule) {
            if (item.rule.id in data.ruleCache) {
                cb(null, data.ruleCache[item.rule.id]);
            } else {
                item.rule.execute(data.user, (err, access)=> {
                    if (err) {
                        cb(err);
                    } else {
                        data.ruleCache[item.rule.id] = access ? true : false;
                        cb(null, access);
                    }
                }, data.params);
            }
        } else cb(null, true);
    }
};
module.exports.init();

let Item = require('./Item');
let Rule = require('./Rule');