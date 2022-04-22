/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

module.exports = class Exception {

    constructor (err, data) {
        if (err instanceof Exception) {
            Object.assign(this, err);
        } else if (err instanceof Error) {
            this.message = err.message;
            this.error = err;
        } else if (typeof err === 'string') {
            this.message = err;
            if (data !== undefined) {
                this.data = data;
            }
        } else if (err !== undefined) {
            this.data = err;
        }
    }

    toString () {
        return this.message || this.data;
    }
};