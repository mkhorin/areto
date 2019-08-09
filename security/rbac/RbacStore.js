/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class RbacStore extends Base {

    async load () {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    async createItems () {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    async createRules () {
        throw new Error(this.wrapClassMessage('Need to override'));
    }

    log () {
        CommonHelper.log(this.rbac, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../../helper/CommonHelper');