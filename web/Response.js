/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Response extends Base {

    static getConstants () {
        return {
            OK: 200,
            CREATED: 201,
            ACCEPTED: 202,
            NO_CONTENT: 204,
            RESET_CONTENT: 205,
            PARTIAL_CONTENT: 206,

            MULTIPLE_CHOICES: 300,
            MOVED_PERMANENTLY: 301,
            MOVED_TEMPORARILY: 302,
            SEE_OTHER: 303,
            NOT_MODIFIED: 304,
            USE_PROXY: 305,
            TEMPORARY_REDIRECT: 307,
            PERMANENT_REDIRECT: 308,

            BAD_REQUEST: 400,
            UNAUTHORIZED: 401,
            PAYMENT_REQUIRED: 402,
            FORBIDDEN: 403,
            NOT_FOUND: 404,
            METHOD_NOT_ALLOWED: 405,
            NOT_ACCEPTABLE: 406,
            PROXY_AUTHENTICATION_REQUIRED: 407,
            REQUEST_TIMEOUT: 408,
            CONFLICT: 409,
            GONE: 410,
            LENGTH_REQUIRED: 411,
            PRECONDITION_FAILED: 412,
            PAYLOAD_TOO_LARGE: 413,
            URI_TOO_LONG: 414,
            UNSUPPORTED_MEDIA_TYPE: 415,
            RANGE_NOT_SATISFIABLE: 416,
            EXPECTATION_FAILED: 417,
            AUTHENTICATION_TIMEOUT: 419,
            MISDIRECTED_REQUEST: 421,
            UNPROCESSABLE_ENTITY: 422,
            LOCKED: 423,
            FAILED_DEPENDENCY: 424,
            TOO_EARLY: 425,
            UPGRADE_REQUIRED: 426,
            PRECONDITION_REQUIRED: 428,
            TOO_MANY_REQUESTS: 429,
            REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
            RETRY_WITH: 449,
            UNAVAILABLE_FOR_LEGAL_REASONS: 451,
            CLIENT_CLOSED_REQUEST: 499,

            INTERNAL_SERVER_ERROR: 500,
            NOT_IMPLEMENTED: 501,
            BAD_GATEWAY: 502,
            SERVICE_UNAVAILABLE: 503,
            GATEWAY_TIMEOUT: 504,
            INSUFFICIENT_STORAGE: 507,
            LOOP_DETECTED: 508,
            BANDWIDTH_LIMIT_EXCEEDED: 509,
            NOT_EXTENDED: 510,
            NETWORK_AUTHENTICATION_REQUIRED: 511,
            UNKNOWN_ERROR: 520,
            WEB_SERVER_IS_DOWN: 521,
            CONNECTION_TIMED_OUT: 522,
            ORIGIN_IS_UNREACHABLE: 523,
            TIMEOUT_OCCURRED: 524,
            SSL_HANDSHAKE_FAILED: 525,
            INVALID_SSL_CERTIFICATE: 526
        };
    }

    code = this.OK;

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
            const message = `Headers already sent: ${method}: ${originalUrl}`;
            return this.controller.log('error', message);
        }
        if (this.code) {
            res.status(this.code);
        }
        !this.method || this.method === 'end'
            ? res.end(this.data, this.encoding)
            : res[this.method](this.data);
    }
};
module.exports.init();