'use strict';

module.exports = class Exception {

    constructor (err, data) {
        if (err instanceof Exception) {
            Object.assign(this, err);
        } else if (err instanceof Error) {
            this.message = err.message;
            this.data = err.stack;
            this.error = err;
        } else if (typeof err === 'object') {
            this.message = '';
            this.data = err;
        } else {
            this.message = err;
            this.data = data;
        }
    }

    toString () {
        return this.message;
    }
};