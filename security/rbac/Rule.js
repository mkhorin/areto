/**
 * @copyright Copyright (c) 2019 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../../base/Base');

module.exports = class Rule extends Base {

    isUser (id) {
        return this.isEqual(id, this.getUserId());
    }

    isEqual (a, b) {
        return a === b || JSON.stringify(a) === JSON.stringify(b);
    }

    getPostParam () {
        return this.params.controller.getPostParam(...arguments);
    }

    getQueryParam () {
        return this.params.controller.getQueryParam(...arguments);
    }

    getUser () {
        return this.params.controller.user;
    }

    getUserId () {
        return this.params.controller.user.getId();
    }

    async execute () {
        return false;
    }

    log () {
        CommonHelper.log(this.inspector, this.constructor.name, ...arguments);
    }
};

const CommonHelper = require('../../helper/CommonHelper');