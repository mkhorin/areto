/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Response extends Base {

    code = 200;

    has () {
        return !!this.method;
    }

    redirect (url) {
        this.method = 'redirect';
        this.data = url || '';
    }

    send (method, data, code) {
        this.method = method;
        this.data = data;
        this.code = code || this.code;
    }

    sendData (data, encoding) {
        this.method = 'end';
        this.data = data;
        this.encoding = encoding;
    }

    end () {
        const res = this.controller.res;
        if (res.headersSent) {
            const {method, originalUrl} = this.controller.req;
            return this.controller.log('error', `Headers already sent: ${method}: ${originalUrl}`);
        }
        if (this.code) {
            res.status(this.code);
        }
        !this.method || this.method === 'end'
            ? res.end(this.data, this.encoding)
            : res[this.method](this.data);
    }
};