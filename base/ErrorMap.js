/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class ErrorMap {

    _data = {};

    has (key) {
        return key ? Object.prototype.hasOwnProperty.call(this._data, key)
                   : Object.values(this._data).length > 0;
    }

    get (key) {
        return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : [];
    }


    getFirst (key) {
        if (key) {
            return this.has(key) ? this._data[key][0] : '';
        }
        for (const items of Object.values(this._data)) {
            if (items.length) {
                return items[0];
            }
        }
        return '';
    }

    getAllFirst () {
        const result = {};
        for (const key of Object.keys(this._data)) {
            if (this._data[key].length) {
                result[key] = this._data[key][0];
            }
        }
        return result;
    }

    add (key, error) {
        if (!error) {
            return this;
        }
        if (Array.isArray(this._data[key])) {
            this._data[key].push(error);
        } else {
            this._data[key] = [error];
        }
        return this;
    }

    assign (data) {
        if (!data) {
            return this;
        }
        for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) {
                for (const value of data[key]) {
                    this.add(key, value);
                }
            } else {
                this.add(key, data[key]);
            }
        }
        return this;
    }

    clear (key) {
        if (key) {
            delete this._data[key];
        } else {
            this._data = {};
        }
        return this;
    }
};