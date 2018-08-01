'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitStore extends Base {

    constructor (config) {
        super(Object.assign({
           model: require('./RateLimitModel')
        }, config));
    }

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
        return ClassHelper.createInstance(this.model, Object.assign({
            store: this
        }, config));
    }
};

const ClassHelper = require('../../helper/ClassHelper');