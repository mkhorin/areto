/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./SessionStore');

module.exports = class MemorySessionStore extends Base {

    _items = {};

    get (id, callback) {
        callback(null, this.isExpired(id) ? undefined : this._items[id].data);
    }

    set (id, data, callback) {
        this._items[id] = {
            sid: id,
            updatedAt: new Date,
            data
        };
        callback();
    }

    touch (id, data, callback) {
        if (Object.prototype.hasOwnProperty.call(this._items, id)) {
            this._items[id].updatedAt = new Date;
        }
        callback();
    }

    destroy (id, callback) {
        this.deleteById(id);
        callback();
    }

    clear (callback) {
        this._items = {};
        callback();
    }

    getById (id) {
        return Object.prototype.hasOwnProperty.call(this._items, id)
            ? this._items[id]
            : null;
    }

    count (search) {
        return this.filterItems(search).length;
    }

    list (start, length, search) {
        return this.filterItems(search).slice(start, start + length);
    }

    deleteExpired () {
        for (const id of Object.keys(this._items)) {
            if (this.isExpired(id)) {
                this.deleteById(id);
            }
        }
    }

    deleteById (id) {
        if (Object.prototype.hasOwnProperty.call(this._items, id)) {
            delete this._items[id];
        }
    }

    deleteByUserId (id) {
        id = String(id);
        for (const key of Object.keys(this._items)) {
            if (String(this._items[key].data[this.userIdParam]) === id) {
                delete this._items[key];
            }
        }
    }

    isExpired (id) {
        return Object.prototype.hasOwnProperty.call(this._items, id)
            ? this.session.isExpired(this._items[id].updatedAt)
            : true;
    }

    filterItems (value) {
        const items = Object.values(this._items);
        return value
            ? items.filter(item => this.filterItem(item, value))
            : items;
    }

    filterItem (item, value) {
        return item.sid === value || String(item.data[this.userIdParam]) === value;
    }
};