'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitStore extends Base {

    configure (cb) {
        cb();
    }

    find (type, user, cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    save (model, cb) {
        cb(this.wrapClassMessage('Need to override'));
    }

    createModel (config) {
        return new RateLimitModel(Object.assign({
            store: this
        }, config));
    }
};

const RateLimitModel = require('./RateLimitModel');