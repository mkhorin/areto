/**
 * @copyright Copyright (c) 2018 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('./Exception');

module.exports = class HttpException extends Base {

    constructor (status, err) {
        super(err);        
        this.status = status;
    }

    isServerError () {
        return this.status >= 500;
    }

    toString () {
        let data = util.inspect(this.data);
        let message = this.message || '';            
        return this.method
            ? `${this.status} ${this.method} ${this.originalUrl} ${this.ip} ${message} ${data}`
            : `${this.status} ${message} ${data}`;
    }

    setParams (req, res) {
        this.method = req.method;
        this.originalUrl = req.originalUrl;
        this.ip = req.ip;
    }
};

const util = require('util');