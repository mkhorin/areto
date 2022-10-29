/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class DependentOrder extends Base {

    constructor (config) {
        super({
            keyAttr: 'id',
            dependsAttr: 'depends',
            ...config
        });
    }

    sort (items) {
        this.createItems(items);
        this.setItemIndexes();
        this.sortByIndex();
        this._orders = [];
        for (const item of this._items) {
            this._chain = [];
            this.orderItem(item);
        }
        return this._orders.map(item => item.source);
    }

    createItems (items) {
        this._items = [];
        this._itemMap = {};
        for (let i = 0; i < items.length; ++i) {
            const item = this.createItem(items[i], i);
            this._items.push(item);
            this._itemMap[item.id] = item;
        }
    }

    createItem (source, index) {
        return {
            id: this.getItemId(source),
            depends: this.getItemDepends(source),
            source,
            index
        };
    }

    setItemIndexes () {
        for (const item of this._items) {
            item.index = this.getItemIndex(item);
        }
    }

    getItemIndex (item) {
        if (item.depends.includes('#start')) {
            return item.index - this._items.length;
        }
        if (item.depends.includes('#end')) {
            return item.index + this._items.length;
        }
        return item.index;
    }

    sortByIndex () {
        this._items.sort((a, b) => a.index - b.index);
    }

    orderItem (item) {
        this._chain.push(item);
        if (item.sorting) {
            const items = this._chain.map(item => item.id);
            throw new Error(`Circular dependency: ${items}`);
        }
        item.sorting = true;
        this.orderItemDepends(item);
        if (!this._orders.includes(item)) {
            this._orders.push(item);
        }
        item.sorting = false;
        this._chain.pop();
    }

    orderItemDepends (item) {
        for (let master of item.depends) {
            master = this.getItem(master);
            if (master) {
                this.orderItem(master);
            }
        }
    }

    getItem (id) {
        return Object.prototype.hasOwnProperty.call(this._itemMap, id)
            ? this._itemMap[id]
            : null;
    }

    getItemId (item) {
        return item[this.keyAttr];
    }

    /**
     * @param {Object} item
     * @param {{string|Array)} item.depends - #start, #end, itemId
     * @returns {Array}
     */
    getItemDepends (item) {
        const depends = item[this.dependsAttr];
        return Array.isArray(depends)
            ? depends
            : depends ? [depends] : [];
    }
};