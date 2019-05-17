/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitStore extends Base {

    constructor (config) {
        super({
           model: require('./RateLimitModel'),
            ...config
        });
    }

    async init () {
    }

    async find (type, user) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    async save (model) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    createModel (config) {
        return ClassHelper.spawn(this.model, {store: this, ...config});
    }
};

const ClassHelper = require('../../helper/ClassHelper');