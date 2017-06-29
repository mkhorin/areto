'use strict';

const Base = require('../base/Component');

module.exports = class Rbac extends Base {

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
        this.store = MainHelper.createInstance(this.store, {
            manager: this
        });
    }

    configure (cb) {
        setImmediate(()=> this.load(cb));
    }
   
    afterLoad () {
        this.trigger(this.EVENT_AFTER_LOAD);
    }

    load (cb) {
        if (this.loading) {
            return cb(null, `${this.constructor.name}: Loading in progress`);
        }
        this.loading = true;
        this.store.load((err, data)=> {
            this.loading = false;
            if (err) {
                this.module.log('error', `${this.constructor.name}: load`, err);
                return cb(err);
            }
            this.build(data);
            this.afterLoad();
            cb();
        });
    }

    build (data) {
        this.ruleIndex = {};
        for (let id of Object.keys(data.rules)) {
            this.ruleIndex[id] = MainHelper.createInstance(data.rules[id], {id});
        }
        this.itemIndex = {};
        for (let id of Object.keys(data.items)) {
            let rule = data.items[id].rule;
            if (rule) {
                data.items[id].rule = Object.prototype.hasOwnProperty.call(this.ruleIndex, rule)
                    ? this.ruleIndex[rule] : MainHelper.createInstance(rule, {id});
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
                    throw new Error(`${this.constructor.name}: Unknown child "${id}"`);
                }
            }
            item.children = children;
        }
    }

    getUserAssignments (userId) {
        return Object.prototype.hasOwnProperty.call(this.assignmentIndex, userId)
            ? this.assignmentIndex[userId].items : null;
    }

    can (user, assignments, id, cb, params) {
        let item = this.itemIndex[id];
        if (this.loading || !item || !assignments || assignments.length === 0) {
            return cb();
        }
        let result, data = {
            assignment: null,
            ruleCache: {},
            user,
            params
        };
        async.eachSeries(assignments, (assignment, assignCallback)=> {
            if (Object.prototype.hasOwnProperty.call(this.itemIndex, assignment)) {
                data.assignment = this.itemIndex[assignment];
                this.canItem(item, data, (err, access)=> {
                    err ? cb(err)
                        : access ? cb(null, true) : assignCallback();
                });
            } else {
                assignCallback();
            }
        }, cb);
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
        if (!item.rule) {
            return cb(null, true);
        }
        if (Object.prototype.hasOwnProperty.call(data.ruleCache, item.rule.id)) {
            return cb(null, data.ruleCache[item.rule.id]);
        }
        item.rule.execute(data.user, (err, access)=> {
            if (err) {
                return cb(err);
            }
            data.ruleCache[item.rule.id] = access ? true : false;
            cb(null, access);
        }, data.params);
    }
};
module.exports.init();

const async = require('async');
const MainHelper = require('../helpers/MainHelper');
const Item = require('./Item');
const Rule = require('./Rule');