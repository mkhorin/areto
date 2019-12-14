/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Exception');

module.exports = class HttpException extends Base {

    constructor (status, err, data) {
        super(err, data);
        this.status = status;
    }

    isServerError () {
        return this.status >= 500;
    }

    toString () {
        const message = this.message || '';
        const data = this.data === undefined ? '' : util.inspect(this.data);
        return this.method
            ? `${this.status} ${this.method} ${this.originalUrl} ${this.ip} ${message} ${data}`
            : `${this.status} ${message} ${data}`;
    }

    setParams (req) {
        this.method = req.method;
        this.originalUrl = req.originalUrl;
        this.ip = req.ip;
    }
};

const util = require('util');