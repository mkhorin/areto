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
            Item: require('./Item')
        }, config));        
    }
    
    init () {
        super.init();
        this.store = ClassHelper.createInstance(this.store, {
            rbac: this
        });
    }

    configure (cb) {
        setImmediate(this.load.bind(this, cb));
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
                this.log('error', `${this.constructor.name}: load`, err);
                return cb(err);
            }
            this.build(data);
            this.afterLoad();
            cb();
        });
    }

    build (data) {
        this.ruleMap = {};
        for (let name of Object.keys(data.rules)) {
            this.ruleMap[name] = ClassHelper.normalizeCreationData(data.rules[name], {name});
        }
        this.resolveItemRules(data.items);
        this.itemMap = {};
        for (let name of Object.keys(data.items)) {
            this.itemMap[name] = new this.Item(Object.assign({
                rbac: this
            }, data.items[name]));
        }
        for (let id of Object.keys(data.items)) {
            this.resolveItemLinks(this.itemMap[id]);
        }
        this.assignmentIndex = data.assignments;
    }

    resolveItemRules (itemMap) {
        for (let item of Object.values(itemMap)) {
            let rule = item.rule;
            if (rule) {
                item.rule = Object.prototype.hasOwnProperty.call(this.ruleMap, rule)
                    ? this.ruleMap[rule]
                    : ClassHelper.normalizeCreationData(rule);
            }
        }
    }

    resolveItemLinks (item) {
        if (item.children instanceof Array) {
            let children = [];
            for (let id of item.children) {
                if (!(this.itemMap[id] instanceof this.Item)) {
                    throw new Error(`${this.constructor.name}: Unknown child: ${id}`);
                }
                children.push(this.itemMap[id]);
                this.itemMap[id].addParent(item);
            }
            item.children = children;
        }
    }

    getUserAssignments (userId) {
        return Object.prototype.hasOwnProperty.call(this.assignmentIndex, userId)
            ? this.assignmentIndex[userId] : null;
    }

    can (assignments, itemId, cb, params) {
        if (this.loading || !Object.prototype.hasOwnProperty.call(this.itemMap, itemId)
            || !assignments || assignments.length === 0) {
            return cb();
        }
        let inspector = new this.Inspector({params});
        AsyncHelper.someSeries(assignments, (assignment, cb)=> {
            if (!Object.prototype.hasOwnProperty.call(this.itemMap, assignment)) {
                return cb();
            }
            inspector.assignment = this.itemMap[assignment];
            inspector.execute(this.itemMap[itemId], cb);
        }, cb);
    }

    setDefaults (configName, module, cb) {
        const defaults = module.config[configName];
        AsyncHelper.series([
            cb => defaults ? this.store.createRules(defaults.rules, cb) : cb(),
            cb => defaults ? this.store.createItems(defaults.items, cb) : cb(),
            cb => AsyncHelper.eachOfSeries(module.modules, (module, name, cb)=> {
                this.setDefaults(configName, module, cb);
            }, cb)
        ], cb);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const ClassHelper = require('../helpers/ClassHelper');