/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class RateLimitStore extends Base {

    constructor (config) {
        super({
           Model: require('./RateLimitModel'),
            ...config
        });
    }

    async init () {
    }

    async find () {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    async save () {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    createModel (config) {
        return this.spawn(this.Model, {store: this, ...config});
    }
};