'use strict';

const Base = require('../base/Base');

module.exports = class Response extends Base {

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
        let res = this.controller.res;
        if (res.headersSent) {
            let req = this.controller.req;
            return this.controller.log('error', `Headers already sent: ${req.method}: ${req.originalUrl}`);
        }
        if (this.code) {
            res.status(this.code);
        }
        let method = this.method || 'end';
        !this.method || this.method === 'end'
            ? res.end(this.data, this.encoding)
            : res[this.method](this.data);
    }
};