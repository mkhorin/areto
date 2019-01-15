/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class DependentOrder extends Base {

    constructor (config) {
        super({
            'keyAttr': 'id',
            'dependsAttr': 'depends',
            ...config
        });
    }

    sort (items) {
        this.createItems(items);
        this.setItemIndexes();
        this.sortByIndex();
        this._orders = [];
        for (let item of this._items) {
            this._chain = [];
            this.orderItem(item);
        }
        return this._orders.map(item => item.source);
    }

    createItems (items) {
        this._items = [];
        this._itemMap = {};
        items.forEach((item, index)=> {
            item = this.createItem(item, index);
            this._items.push(item);
            this._itemMap[item.id] = item;
        });
    }

    createItem (item, index) {
        return {
            'id': this.getItemId(item),
            'depends': this.getItemDepends(item),
            'index': index,
            'source': item
        };
    }

    setItemIndexes () {
        this._items.forEach(item => {
            item.index = this.getItemIndex(item);
        });
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
        this._items.sort((a, b)=> a.index - b.index);
    }

    orderItem (item) {
        this._chain.push(item);
        if (item.sorting) {
            throw new Error('Circular dependency: '+ this._chain.map(item => item.id));
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
        return Object.prototype.hasOwnProperty.call(this._itemMap, id) ? this._itemMap[id] : null;
    }

    getItemId (item) {
        return item[this.keyAttr];
    }

    getItemDepends (item) { // ['#start', '#end', 'item id']
        let depends = item[this.dependsAttr];
        return Array.isArray(depends) ? depends : depends ? [depends] : [];
    }
};