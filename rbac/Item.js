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

    async create () {
        if (!this.constructor.isType(this.data.type)) {
            throw new Error(`Invalid '${this.data.type}' type  for RBAC item: ${this.name}`);
        }
        let item = await this.store.findItemByName(this.name).one();
        if (item) {
            return this.store.log('warn', `RBAC item already exists: ${this.name}`);
        }
        let relations = await this.resolveRelations();
        relations.name = this.name;
        let doc = Object.assign({}, this.data, relations);
        ObjectHelper.deleteProps(['children', 'parents'], doc);
        await this.store.findItem().insert(doc);
    }

    async resolveRelations () {
        let result = {};
        await this.resolveRuleRelation(result);
        return result;
    }

    async resolveRuleRelation (result) {
        if (this.data.rule) {
            result.rule = await this.store.findRuleByName(this.data.rule).scalar(this.store.key);
            if (!result.rule) {
                throw new Error(`Not found rule for RBAC item: ${this.name}`);
            }
        } else {
            result.rule = null;
        }
    }

    async setChildren () {
        if (this.data.children && this.data.children.length) {
            this.data.children = this.findRelatives('children');
            await this.store.findItemChild().and({
                'parent': this.data.itemId,
                'child': this.data.children
            }).remove();
            await this.store.findItemChild().insert(this.data.children.map(id => ({
                'parent': this.data.itemId,
                'child': id
            })));
        }
    }

    async setParents () {
        if (this.data.parents && this.data.parents.length) {
            this.data.parents = await this.findRelatives('parents');
            await this.store.findItemChild().and({
                'parent': this.data.parents,
                'child': this.data.itemId
            }).remove();
            await this.store.findItemChild().insert(this.data.parents.map(id => ({
                'parent': id,
                'child': this.data.itemId
            })));
        }
    }

    async findRelatives (relKey) {
        let items = await this.store.findItemByName(this.name).one();
        this.data.itemId = item ? item[this.store.key] : null;
        items = await this.store.findItemByName(this.data[relKey]).all();
        if (items.length === this.data[relKey].length) {
            return items.map(item => item[this.store.key])
        }
        throw new Error(`Not found '${this.data[relKey]}' ${relKey} for RBAC item: ${this.name}`);
    }
};
module.exports.init();

const ObjectHelper = require('../helper/ObjectHelper');