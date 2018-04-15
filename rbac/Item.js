'use strict';

const Base = require('../base/Base');

module.exports = class Item extends Base {

    static getConstants () {
        return {
            TYPE_PERMISSION: 'permission',
            TYPE_ROLE: 'role',
            TYPE_ROUTE: 'route'
        };
    }

    static isType (type) {
        return type === this.TYPE_PERMISSION || type === this.TYPE_ROLE || type === this.TYPE_ROUTE;
    }

    isPermission () {
        return this.type === this.TYPE_PERMISSION;
    }

    isRole () {
        return this.type === this.TYPE_ROLE;
    }

    isRoute () {
        return this.type === this.TYPE_ROUTE;
    }

    addParent (item) {
        if (!this.parents) {
            this.parents = [];
        }
        this.parents.push(item);
    }

    create (callback) {
        if (!this.constructor.isType(this.data.type)) {
            return callback(`RBAC: Invalid '${this.data.type}' type  for '${this.name}' item`);
        }
        AsyncHelper.waterfall([
            cb => this.store.findItemByName(this.name).one(cb),
            (item, cb)=> {
                if (item) {
                    this.store.log('warn', `RBAC: Item already exists: ${this.name}`);
                    return callback();
                }
                this.resolveRelations(cb);
            },
            (relations, cb)=> {
                relations.name = this.name;
                let doc = Object.assign({}, this.data, relations);
                ObjectHelper.deleteProperties(doc, ['children', 'parents']);
                this.store.findItem().insert(doc, cb);
            }
        ], callback);
    }

    resolveRelations (cb) {
        let result = {};
        this.resolveRuleRelation(result, err => cb(err, result));
    }

    resolveRuleRelation (result, cb) {
        if (!this.data.rule) {
            result.rule = null;
            return cb();
        }
        this.store.findRuleByName(this.data.rule).scalar(this.store.key, (err, id)=>{
            result.rule = id;
            cb(err || (!id && `RBAC: Not found rule for item: ${this.name}`));
        });
    }

    setChildren (cb) {
        if (!this.data.children || !this.data.children.length) {
            return cb();
        }
        AsyncHelper.waterfall([
            cb => this.findRelatives('children', cb),
            (ids, cb)=> {
                this.data.children = ids;
                this.store.findItemChild().and({
                    parent: this.data.itemId,
                    child: this.data.children
                }).remove(cb);
            },
            cb => this.store.findItemChild().insert(this.data.children.map(id => ({
                parent: this.data.itemId,
                child: id
            })), cb)
        ], cb);
    }

    setParents (cb) {
        if (!this.data.parents || !this.data.parents.length) {
            return cb();
        }
        AsyncHelper.waterfall([
            cb => this.findRelatives('parents', cb),
            (ids, cb)=> {
                this.data.parents = ids;
                this.store.findItemChild().and({
                    parent: this.data.parents,
                    child: this.data.itemId
                }).remove(cb);
            },
            cb => this.store.findItemChild().insert(this.data.parents.map(id => ({
                parent: id,
                child: this.data.itemId
            })), cb)
        ], cb);
    }

    findRelatives (relKey, cb) {
        AsyncHelper.waterfall([
            cb => this.store.findItemByName(this.name).one(cb),
            (item, cb)=> {
                this.data.itemId = item ? item[this.store.key] : null;
                this.store.findItemByName(this.data[relKey]).all(cb);
            },
            (items, cb)=> {
                items.length !== this.data[relKey].length
                    ? cb(`RBAC: Not found '${this.data[relKey]}' ${relKey} for item: ${this.name}`)
                    : cb(null, items.map(item => item[this.store.key]));
            }
        ], cb);
    }
};
module.exports.init();

const AsyncHelper = require('../helpers/AsyncHelper');
const ObjectHelper = require('../helpers/ObjectHelper');