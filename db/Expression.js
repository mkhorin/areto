/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
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
                for (const key of Object.keys(this.params)) {
                    const regex = new RegExp(`:${key}`, 'g');
                    const value = db.escape(this.params[key]);
                    this._value = this._value.replace(regex, value);
                }
            }
        }
        return this._value;
    }
};