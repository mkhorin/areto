'use strict';

module.exports = class ErrorMap {

    constructor () {
        this._data = {};
    }

    has (key) {
        return key
            ? Object.prototype.hasOwnProperty.call(this._data, key)
            : Object.values(this._data).length > 0;
    }

    get (key) {
        return Object.prototype.hasOwnProperty.call(this._data, key) ? this._data[key] : [];
    }

    getOneFirst (key) {
        if (key) {
            return this.has(key) ? this._data[key][0] : '';
        }
        for (let items of Object.values(this._data)) {
            if (items.length) {
                return items[0];
            }
        }
        return '';
    }

    getAllFirst () {
        let result = {};
        for (let key of Object.keys(this._data)) {
            if (this._data[key].length) {
                result[key] = this._data[key][0];
            }
        }
        return result;
    }

    add (key, value) {
        if (!value) {
            return false;
        }
        if (!this.has(key)) {
            this._data[key] = [];
        }
        //value = value instanceof Message ? value : new Message(value);
        this._data[key].push(value);
    }

    addMap (data) {
        if (!data) {
            return false;
        }
        for (let key of Object.keys(data)) {
            if (data[key] instanceof Array) {
                for (let value of data[key]) {
                    this.add(key, value);
                }
            } else {
                this.add(key, data[key]);
            }
        }
    }

    clear (key) {
        if (key) {
            delete this._data[key];
        } else {
            this._data = {};
        }
    }
};

const Message = require('../i18n/Message');