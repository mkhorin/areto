/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./RateLimitStore');

module.exports = class MemoryRateLimitStore extends Base {

    static getTypeKey (user) {
        return user.getId() || user.getIp();
    }

    constructor (config) {
        super(config);
        this._data = {};
    }

    hasType (type) {
        return Object.prototype.hasOwnProperty.call(this._data, type);
    }

    async find (type, user) {
        let model = this.createModel({type, user});
        if (this.hasType(type)) {
            let key = this.constructor.getTypeKey(user);
            model.setData(this._data[type][key]);
        }
        return model;
    }

    async save (model) {
        if (!this.hasType(model.type)) {
            this._data[model.type] = {};
        }
        let key = this.constructor.getTypeKey(model.user);
        this._data[model.type][key] = model.getData();
    }
};