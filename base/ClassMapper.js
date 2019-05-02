/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Base');

module.exports = class ClassMapper extends Base {

    init () {
        this._map = {};
        this._parent = this.module.parent && this.module.parent.classMapper;
        Object.assign(this._map, this.getConfig());
    }

    getConfig () {
        return this.module.getConfig('classes');
    }

    get (key) {
        return Object.prototype.hasOwnProperty.call(this._map, key)
            ? this._map[key]
            : this._parent && this._parent.get(key);
    }

    getOwn (key) {
        return Object.prototype.hasOwnProperty.call(this._map, key) ? this._map[key] : null;
    }

    spawn (key, params) {
        return ClassHelper.spawn(this.get(key), Object.assign({'module': this.module}, params));
    }
};

const ClassHelper = require('../helper/ClassHelper');

