'use strict';

const Base = require('../base/Base');

module.exports = class Response extends Base {

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

    end (controller) {
        let res = this.controller.res;
        if (res.headersSent) {
            let req = this.controller.req;
            return controller.log('error', `Headers already sent: ${req.method}: ${req.originalUrl}`);
        }
        if (this.code) {
            res.status(this.code);
        }
        switch (this.method) {
            case 'end':
                res.end(this.data, this.encoding);
                break;
            default:
                res[this.method](this.data);
        }
    }
};