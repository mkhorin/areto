/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class Expression {

    constructor (value, params) {
        this.value = value;
        this.params = params;
    }

    get (db) {
        if (this._value === undefined) {
            this._value = this.value;
            if (this.params) {
                for (let key of Object.keys(this.params)) {
                    this._value = this._value.replace(new RegExp(`:${key}`, 'g'), db.escape(this.params[key]));
                }
            }
        }
        return this._value;
    }
};