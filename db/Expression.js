'use strict';

let Base = require('../base/Base');

module.exports = class Expression extends Base {

    constructor (value, params) {
        super({value, params});
    }

    get (db) {
        if (this._value === undefined) {
            this._value = this.value;
            if (this.params) {
                for (let key in this.params) {
                    this._value = this._value.replace(new RegExp(':'+ key, 'g'), db.escape(this.params[key]));
                }
            }
        }
        return this._value;
    }
};