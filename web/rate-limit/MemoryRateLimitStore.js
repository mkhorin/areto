'use strict';

const Base = require('./RateLimitStore');

module.exports = class MemoryRateLimitStore extends Base {

    init () {
        this._data = {};
    }

    find (type, user, cb) {
        let model = this.createModel({type, user});
        if (Object.prototype.hasOwnProperty.call(this._data, type)) {
            let key = user.getId() || user.getIp();
            model.setData(this._data[type][key]);
        }
        cb(null, model);
    }

    save (model, cb) {
        if (!Object.prototype.hasOwnProperty.call(this._data, model.type)) {
            this._data[model.type] = {};
        }
        let key = model.user.getId() || model.user.getIp();
        this._data[model.type][key] = model.getData();
        cb();
    }
};