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
            store: require('./FileStore'),
            Inspector: require('./Inspector'),
        }, config));        
    }
    
    init () {
        super.init();
        this.store = MainHelper.createInstance(this.store, {
            rbac: this
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
        if (item.children instanceof Array) {
            let children = [];
            for (let id of item.children) {
                if (this.itemIndex[id] instanceof Item) {
                    children.push(this.itemIndex[id]);
                    this.itemIndex[id].addParent(item);
                } else {
                    throw new Error(`${this.constructor.name}: Unknown child: ${id}`);
                }
            }
            item.children = children;
        }
    }

    getUserAssignments (userId) {
        return Object.prototype.hasOwnProperty.call(this.assignmentIndex, userId)
            ? this.assignmentIndex[userId] : null;
    }

    can (user, assignments, itemId, callback, params) {
        if (this.loading || !Object.prototype.hasOwnProperty.call(this.itemIndex, itemId)
            || !assignments || assignments.length === 0) {
            return callback();
        }
        let inspector = new this.Inspector({user, params});
        async.eachSeries(assignments, (assignment, cb)=> {
            if (!Object.prototype.hasOwnProperty.call(this.itemIndex, assignment)) {
                return cb();
            }
            inspector.assignment = this.itemIndex[assignment];
            inspector.execute(this.itemIndex[itemId], (err, access)=> {
                err ? cb(err) : access ? callback(null, true) : cb();
            });
        }, callback);
    }
};
module.exports.init();

const async = require('async');
const MainHelper = require('../helpers/MainHelper');
const Item = require('./Item');
const Rule = require('./Rule');