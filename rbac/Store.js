/**
 * @copyright Copyright (c) 2018 Maxim Khorin (maksimovichu@gmail.com)
 */
'use strict';

const Base = require('../base/Base');

module.exports = class Store extends Base {

    async load () {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    async createItems (items) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    async createRules (rules) {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    log (type, message, data) {
        CommonHelper.log(type, message, data, this.constructor.name, this.rbac);
    }
};

const CommonHelper = require('../helper/CommonHelper');