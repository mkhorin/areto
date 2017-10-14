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
        if (controller.res.headersSent) {
            return controller.log('error',
                `Headers already sent ${controller.req.method} ${controller.req.originalUrl}`);
        }
        if (this.code) {
            controller.res.status(this.code);
        }
        switch (this.method) {
            case 'end':
                controller.res.end(this.data, this.encoding);
                break;
            default:
                controller.res[this.method](this.data);
        }
    }
};